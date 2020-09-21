import * as vscode from 'vscode';
import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';
import * as sinon from 'sinon';
import * as yaml from 'yaml';
import { expect } from 'chai';
import { fail } from 'assert';
import { ContextType } from '../../src/cli/config';
import { openTreeItemInEditor } from '../../src/editor/knativeOpenTextDocument';
import { KnativeTreeItem } from '../../src/tree/knativeTreeItem';
import { Service } from '../../src/knative/service';

import virtualfs = require('../../src/cli/virtualfs');

chai.use(sinonChai);

suite('Open Text Document', () => {
  const sandbox = sinon.createSandbox();

  const yamlServiceContentUnfiltered = `apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  annotations:
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"serving.knative.dev/v1","kind":"Service","metadata":{"annotations":{"serving.knative.dev/creator":"system:admin","serving.knative.dev/lastModifier":"system:admin"},"name":"example","namespace":"a-serverless-example"},"spec":{"template":{"spec":{"containerConcurrency":0,"containers":[{"image":"quay.io/rhdevelopers/knative-tutorial-greeter:quarkus","name":"user-container","readinessProbe":{"successThreshold":1,"tcpSocket":{"port":0}},"resources":{}}],"timeoutSeconds":300}},"traffic":[{"latestRevision":true,"percent":100}]}}
    serving.knative.dev/creator: system:admin
    serving.knative.dev/lastModifier: system:admin
  creationTimestamp: "2020-07-23T22:53:04Z"
  generation: 5
  managedFields:
  - apiVersion: serving.knative.dev/v1
    fieldsType: FieldsV1
    fieldsV1:
      f:metadata:
        f:annotations:
          .: {}
          f:kubectl.kubernetes.io/last-applied-configuration: {}
      f:spec:
        .: {}
        f:template:
          .: {}
          f:spec:
            .: {}
            f:containers: {}
            f:timeoutSeconds: {}
    manager: kubectl
    operation: Update
    time: "2020-07-23T23:23:04Z"
  - apiVersion: serving.knative.dev/v1
    fieldsType: FieldsV1
    fieldsV1:
      f:status:
        f:address:
          .: {}
          f:url: {}
        f:conditions: {}
        f:latestCreatedRevisionName: {}
        f:latestReadyRevisionName: {}
        f:observedGeneration: {}
        f:traffic: {}
        f:url: {}
    manager: controller
    operation: Update
    time: "2020-07-23T23:23:59Z"
  - apiVersion: serving.knative.dev/v1
    fieldsType: FieldsV1
    fieldsV1:
      f:spec:
        f:traffic: {}
    manager: kn
    operation: Update
    time: "2020-07-23T23:23:59Z"
  name: example
  namespace: a-serverless-example
  resourceVersion: "81373"
  selfLink: /apis/serving.knative.dev/v1/namespaces/a-serverless-example/services/example
  uid: b643305a-c4b1-4c45-8efb-f8edb1c86623
spec:
  template:
    metadata:
      creationTimestamp: null
    spec:
      containerConcurrency: 0
      containers:
      - image: quay.io/rhdevelopers/knative-tutorial-greeter:quarkus
        name: user-container
        readinessProbe:
          successThreshold: 1
          tcpSocket:
            port: 0
        resources: {}
      timeoutSeconds: 300
  traffic:
  - latestRevision: true
    percent: 100
  - latestRevision: false
    percent: 0
    revisionName: example-2fvz4
    tag: old
  - latestRevision: false
    percent: 0
    revisionName: example-75w7v
    tag: current
status:
  address:
    url: http://example.a-serverless-example.svc.cluster.local
  conditions:
  - lastTransitionTime: "2020-07-23T23:23:08Z"
    status: "True"
    type: ConfigurationsReady
  - lastTransitionTime: "2020-07-23T23:23:59Z"
    status: "True"
    type: Ready
  - lastTransitionTime: "2020-07-23T23:23:59Z"
    status: "True"
    type: RoutesReady
  latestCreatedRevisionName: example-75w7v
  latestReadyRevisionName: example-75w7v
  observedGeneration: 5
  traffic:
  - latestRevision: true
    percent: 100
    revisionName: example-75w7v
  - latestRevision: false
    percent: 0
    revisionName: example-2fvz4
    tag: old
    url: http://old-example-a-serverless-example.apps.devcluster.openshift.com
  - latestRevision: false
    percent: 0
    revisionName: example-75w7v
    tag: current
    url: http://current-example-a-serverless-example.apps.devcluster.openshift.com
  url: http://example-a-serverless-example.apps.devcluster.openshift.com
`;
  const uriObject = ('uri' as unknown) as vscode.Uri;
  const jsonServiceContentUnfiltered = yaml.parse(yamlServiceContentUnfiltered);
  const showTextDocOptions = { preserveFocus: true, preview: true };
  const textDocumentObject = ('textDoc' as unknown) as vscode.TextDocument;
  const testService: Service = new Service(
    'example',
    'http://example-a-serverless-example.apps.devcluster.openshift.com',
    jsonServiceContentUnfiltered,
  );
  testService.modified = false;
  const testServiceTreeItem: KnativeTreeItem = new KnativeTreeItem(
    null,
    testService,
    'example',
    ContextType.SERVICE,
    vscode.TreeItemCollapsibleState.Expanded,
    null,
    null,
  );
  testService.modified = true;
  const testServiceTreeItemModified: KnativeTreeItem = new KnativeTreeItem(
    null,
    testService,
    'example',
    ContextType.SERVICE_MODIFIED,
    vscode.TreeItemCollapsibleState.Expanded,
    null,
    null,
  );

  teardown(() => {
    sandbox.restore();
  });

  test('should open a Service tree item in the editor', async () => {
    // help stub to verify that we called virtualfs.vfsUri
    const vfsUriStub = sandbox.stub(virtualfs, 'vfsUri');
    vfsUriStub.returns(uriObject);
    // creates a stub that resolves to mock text doc object, and we will spy on
    const stubOpenTextDoc = sandbox.stub(vscode.workspace, 'openTextDocument');
    stubOpenTextDoc.resolves(textDocumentObject);
    // spies on inner promises (void) functions
    const spyShowTextDoc = sandbox.spy(vscode.window, 'showTextDocument');
    const spyShowError = sandbox.spy(vscode.window, 'showErrorMessage');
    // calling real openTreeItemInEditor funtion with stubbed inner calls
    await openTreeItemInEditor(testServiceTreeItem, 'yaml', false);
    // verify first promise calls and args
    sinon.assert.calledOnce(stubOpenTextDoc);
    sinon.assert.calledWith(stubOpenTextDoc, sinon.match(uriObject));
    // verify inner promise call and passed arguments
    sinon.assert.calledOnce(spyShowTextDoc);
    expect(spyShowTextDoc.firstCall.args.length).to.eq(2);
    sinon.assert.calledWith(spyShowTextDoc, sinon.match(textDocumentObject), sinon.match(showTextDocOptions));
    // verify that no show error was reached in the code
    sinon.assert.notCalled(spyShowError);
  });
  test('should open a modified Service tree item in the editor', async () => {
    sandbox.stub(vscode.workspace, 'openTextDocument').resolves(textDocumentObject);
    const spyShowTextDoc = sandbox.spy(vscode.window, 'showTextDocument');
    await openTreeItemInEditor(testServiceTreeItemModified, 'yaml', true);
    sinon.assert.calledOnce(spyShowTextDoc);
    sinon.assert.calledWith(spyShowTextDoc, sinon.match(textDocumentObject), sinon.match(showTextDocOptions));
  });
  test('should throw an error when attempting to open a Service tree item in the editor when there is no doc', async () => {
    sandbox.stub(vscode.workspace, 'openTextDocument').resolves(null);
    const spyShowTextDoc = sandbox.spy(vscode.window, 'showTextDocument');
    const spyShowError = sandbox.spy(vscode.window, 'showErrorMessage');
    try {
      await openTreeItemInEditor(testServiceTreeItem, 'yaml', false);
      fail('Expected Error was not thrown when there is no doc when opening a Service tree item in editor');
    } catch (error) {
      expect(error).to.be.instanceOf(Error);
      expect(error.message).to.include('Error loading resource located at');
    }
    sinon.assert.notCalled(spyShowTextDoc);
    sinon.assert.notCalled(spyShowError);
  });
  test('should not attempt to open a modified Service tree item in the editor when there is no doc', async () => {
    sandbox.stub(vscode.workspace, 'openTextDocument').resolves(null);
    const spyShowTextDoc = sandbox.spy(vscode.window, 'showTextDocument');
    try {
      await openTreeItemInEditor(testServiceTreeItemModified, 'yaml', true);
      fail('Expected Error was not thrown when there is no doc when opening a Service tree item in editor');
    } catch (error) {
      expect(error).to.be.instanceOf(Error);
      expect(error.message).to.include('Error loading resource located at');
    }
    sinon.assert.notCalled(spyShowTextDoc);
  });
  test('should throw and error when the promise is rejected trying to open a Service tree item in the editor', async () => {
    sandbox.stub(vscode.workspace, 'openTextDocument').rejects('myerror');
    const spyShowTextDoc = sandbox.spy(vscode.window, 'showTextDocument');
    const stubShowError = sandbox.stub(vscode.window, 'showErrorMessage');
    await openTreeItemInEditor(testServiceTreeItem, 'yaml', false);
    sinon.assert.notCalled(spyShowTextDoc);
    sinon.assert.calledOnce(stubShowError);
    const showErrorArgs = stubShowError.firstCall.args;
    expect(showErrorArgs.length).to.eq(1);
    expect(showErrorArgs[0]).to.include('Error loading document: myerror');
  });
});
