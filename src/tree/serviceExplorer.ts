/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { commands, Disposable, extensions, TreeView, Uri, version, window } from 'vscode';
import * as path from 'path';
import { Platform } from '../util/platform';
import { KnativeTreeItem } from './knativeTreeItem';
import { ServiceDataProvider } from './serviceDataProvider';
import { WatchUtil, FileContentChangeNotifier } from '../util/watch';

const kubeConfigFolder: string = path.join(Platform.getUserHomePath(), '.kube');
const kubeconfigSplit: string[] = process.env.KUBECONFIG.split('/');
kubeconfigSplit.pop();
const kubeconfigDir: string = kubeconfigSplit.join('/');
const kubeConfigFolderENV = `${kubeconfigDir  }/`;
// eslint-disable-next-line no-console
console.log(`kubeConfigFolderENV ${kubeConfigFolderENV}`);

function issueUrl(): string {
  const { packageJSON } = extensions.getExtension('redhat.vscode-knative');
  const body = [`VS Code version: ${version}`, `OS: ${Platform.OS}`, `Extension version: ${packageJSON.version}`].join('\n');
  return `${packageJSON.bugs}/new?labels=kind/bug&title=&body=**Environment**\n${body}\n**Description**`;
}

async function reportIssue(): Promise<unknown> {
  return commands.executeCommand('vscode.open', Uri.parse(issueUrl()));
}


export class ServiceExplorer implements Disposable {
  private treeView: TreeView<KnativeTreeItem>;

  private fsw: FileContentChangeNotifier;

  private fswEnv: FileContentChangeNotifier;

  public constructor() {
    const treeDataProvider = new ServiceDataProvider();
    this.fsw = WatchUtil.watchFileForContextChange(kubeConfigFolder, 'config');
    this.fswEnv = WatchUtil.watchFileForContextChange(kubeConfigFolderENV, 'kubeconfig');
    this.fsw.emitter.on('file-changed', treeDataProvider.refresh.bind(this));
    this.fswEnv.emitter.on('file-changed', treeDataProvider.refresh.bind(this));

    // Initialize the tree/explorer view by linking the refernece in the package.json to this class.
    this.treeView = window.createTreeView('knativeProjectExplorerServices', { treeDataProvider });

    commands.registerCommand('service.explorer.create', () => treeDataProvider.addService());
    commands.registerCommand('service.explorer.delete', (treeItem: KnativeTreeItem) => treeDataProvider.deleteFeature(treeItem));
    commands.registerCommand('service.explorer.refresh', () => treeDataProvider.refresh());
    commands.registerCommand('service.explorer.reportIssue', () => reportIssue());
  }

  dispose(): void {
    this.fsw.watcher.close();
    this.treeView.dispose();
  }

  public async reveal(item: KnativeTreeItem): Promise<void> {
    await this.treeView.reveal(item);
  }
}
