/*
* This program and the accompanying materials are made available under the terms of the
* Eclipse Public License v2.0 which accompanies this distribution, and is available at
* https://www.eclipse.org/legal/epl-v20.html
*
* SPDX-License-Identifier: EPL-2.0
*
* Copyright Contributors to the Zowe Project.
*
*/

import { Session, Imperative, Headers, ImperativeError } from "@brightside/imperative";
import { ZosmfRestClient } from "../../../rest";
import { IArchivedWorkflow } from "../../src/api/doc/IArchivedWorkflow";
import { ArchiveWorkflow } from "../..";
import { WorkflowConstants } from "../../src/api/WorkflowConstants";
import { ITestEnvironment } from "../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestProperties } from "../../../../__tests__/__src__/properties/TestProperties";
import { TestEnvironment } from "../../../../__tests__/__src__/environment/TestEnvironment";
import { Upload } from "../../../zosfiles/src/api";
import { CreateWorkflow } from "../../src/api/Create";
import { DeleteWorkflow } from "../../src/api/Delete";


let session: Session;
let testEnvironment: ITestEnvironment;
const workflowKeyConst: string = "0123-456789-abc-def";
let workflowKeyActual: string;
const localWorkflowPath: string = `${__dirname}/testfiles/demo.xml`;
let remoteWorkflowPath: string;
let sysProperties: TestProperties;
const allWorkflowKeys: string[] = [];

async function setup() {
    testEnvironment = await TestEnvironment.setUp({
        testName: "archive_workflow"
    });
    sysProperties = new TestProperties(testEnvironment.systemTestProperties);
    session = TestEnvironment.createZosmfSession(testEnvironment);
    remoteWorkflowPath=`${sysProperties.getDefaultSystem().unix.testdir}/wf${Date.now()}.xml`;
}

async function cleanup() {
    await TestEnvironment.cleanUp(testEnvironment);
}

describe("Archive workflow unit tests - successful scenarios", () => {
    beforeAll(async ()=> {
        await setup();
        await Upload.fileToUSSFile(session, localWorkflowPath, remoteWorkflowPath, true);
    });
    beforeEach(async ()=> {
        const systemName = testEnvironment.systemTestProperties.systems.primary;
        const system = sysProperties.getDefaultSystem();
        const owner = system.zosmf.user;
        const workflowInstance = await CreateWorkflow.createWorkflow(session, `Arch Workflow ${Date.now()}`, remoteWorkflowPath, systemName, owner);
        workflowKeyActual = workflowInstance.workflowKey;
        allWorkflowKeys.push(workflowKeyActual);
    });

    it("Successful archive", async ()=>{
        const response = await ArchiveWorkflow.archiveWorfklowByKey(session, workflowKeyActual, WorkflowConstants.ZOSMF_VERSION);
        const expected: IArchivedWorkflow = {
            workflowKey: workflowKeyActual
        };

        expect(response).toEqual(expected);
    });

    it("Missing z/OSMF REST API version", async ()=>{
        (ZosmfRestClient.postExpectJSON as any) = jest.fn<string>(() => {
            return new Promise((resolve)=>{
                Imperative.console.info("Using mocked function");
                process.nextTick(()=>{
                    const promiseOutput: IArchivedWorkflow = {
                        workflowKey: workflowKeyConst
                    };

                    resolve(promiseOutput);
                });
            });
        });
        const response = await ArchiveWorkflow.archiveWorfklowByKey(session, workflowKeyConst);
        const expected: IArchivedWorkflow = {
            workflowKey: workflowKeyConst
        };

        expect(response).toEqual(expected);
        expect((ZosmfRestClient.postExpectJSON as any)).toHaveBeenCalledTimes(1);
        let query: string = `${WorkflowConstants.RESOURCE}/1.0/${WorkflowConstants.WORKFLOW_RESOURCE}`;
        query+=`/${workflowKeyConst}/${WorkflowConstants.ARCHIVE_WORKFLOW}`;
        expect((ZosmfRestClient.postExpectJSON as any)).toHaveBeenCalledWith(session, query, [Headers.APPLICATION_JSON], null);
    });


    afterAll(async ()=>{
        await cleanup();
        while(allWorkflowKeys.length > 0) {
            const currentKey = allWorkflowKeys.pop();
            const deleted = await DeleteWorkflow.deleteWorkflow(session, currentKey);
            Imperative.console.info(deleted);
        }
    });
});

describe("Missing session", ()=>{
    it("Undefined session", async ()=>{
        try {
            const response = await ArchiveWorkflow.archiveWorfklowByKey(undefined, workflowKeyConst, WorkflowConstants.ZOSMF_VERSION);
            expect(false).toBeTruthy();
        } catch(error) {
            Imperative.console.info(error);
            const expectedError: object = { msg: "[object Object]No session was supplied." };
            expect(error.mDetails).toEqual(expectedError);
        }
    });
    it("Null session", async ()=>{
        try {
            const response = await ArchiveWorkflow.archiveWorfklowByKey(null, workflowKeyConst, WorkflowConstants.ZOSMF_VERSION);
            expect(false).toBeTruthy();
        } catch(error) {
            Imperative.console.info(error);
            const expectedError: object = { msg: "[object Object]No session was supplied." };
            expect(error.mDetails).toEqual(expectedError);
        }
    });
    it("Empty session", async ()=>{
        try {
            const response = await ArchiveWorkflow.archiveWorfklowByKey(new Session({}), workflowKeyConst, WorkflowConstants.ZOSMF_VERSION);
            expect(false).toBeTruthy();
        } catch(error) {
            Imperative.console.info(error);
            const expectedError: object = { msg: "Required parameter 'hostname' must be defined" };
            expect(error.mDetails).toEqual(expectedError);
        }
    });
});

describe("Missing workflow key", ()=> {
    beforeAll(async ()=> {
        setup();
    })
    it("Undefined workflow key", async ()=>{
        try {
            const response = await ArchiveWorkflow.archiveWorfklowByKey(session, undefined, WorkflowConstants.ZOSMF_VERSION);
            expect(false).toBeTruthy();
        } catch(error) {
            Imperative.console.info(error);
            const expectedError: object = { msg: "[object Object]No workflow key parameter was supplied." };
            expect(error.mDetails).toEqual(expectedError);
        }
    });
    it("Null workflow key", async ()=>{
        try {
            const response = await ArchiveWorkflow.archiveWorfklowByKey(session, null, WorkflowConstants.ZOSMF_VERSION);
            expect(false).toBeTruthy();
        } catch(error) {
            Imperative.console.info(error);
            const expectedError: object = { msg: "[object Object]No workflow key parameter was supplied." };
            expect(error.mDetails).toEqual(expectedError);
        }
    });
    it("Empty workflow key", async ()=>{
        try {
            const response = await ArchiveWorkflow.archiveWorfklowByKey(session, "", WorkflowConstants.ZOSMF_VERSION);
            expect(false).toBeTruthy();
        } catch(error) {
            Imperative.console.info(error);
            const expectedError: object = { msg: "[object Object]No workflow key parameter was supplied." };
            expect(error.mDetails).toEqual(expectedError);
        }
    });

    afterAll(async () => {
        cleanup();
    });
});

describe("Errors caused by the user interaction", ()=>{
    beforeAll(async () => {
        await setup();
    });

    it("404 Not Found", async ()=>{
        try {
            const response = await ArchiveWorkflow.archiveWorfklowByKey(session, workflowKeyConst, WorkflowConstants.ZOSMF_VERSION);
            expect(false).toBeTruthy();
        } catch(error) {
            Imperative.console.info(JSON.stringify(error));
            expect(error).toMatchSnapshot("archive_404_snap");
        }
    });
    it("409 Request Conflict", async ()=>{
        const errorCodeConst = "409";
        const msgConst = "Request Conflict";
        (ZosmfRestClient.postExpectJSON as any) = jest.fn<string>(() => {
            return new Promise(()=>{
                Imperative.console.info("Using mocked function");
                const error =  new ImperativeError({
                    msg: msgConst,
                    errorCode: errorCodeConst
                });
                throw error;
            });
        });

        try {
            const response = await ArchiveWorkflow.archiveWorfklowByKey(session, workflowKeyConst, WorkflowConstants.ZOSMF_VERSION);
            expect(false).toBeTruthy();
        } catch(error) {
            Imperative.console.info(error);
            expect(error.mDetails).toEqual({msg: msgConst, errorCode: errorCodeConst});
        }
    });

    afterAll(async () => {
        cleanup();
    });
});
