// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import KnativeExplorer from './explorer';
import Service from './knative/service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function displayResult(result?: any): void {
  if (result && typeof result === 'string') {
    vscode.window.showInformationMessage(result);
  }
}

interface CommandI<T> {
  (...args: T[]): Promise<string>;
}
/**
 *
 * @param command with a type that is either "a function that returns a promise" or undefined/null
 * @param params
 */
function execute<T>(command: CommandI<T> | void, ...params: T[]): any {
  try {
    if (command === undefined || command === null) {
      return undefined;
    }
    const func =  command as CommandI<T>;

    // const res = command.call(null, ...params);
    const res = func(...params);

    return res && res.then
      ? res
          .then((result: any) => {
            displayResult(result);
          })
          .catch((err: any) => {
            vscode.window.showErrorMessage(err.message ? err.message : err);
          })
      : undefined;
  } catch (err) {
    vscode.window.showErrorMessage(err);
  }
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext): void {
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = [
    // vscode.commands.registerCommand('knative.service.list', () => Service.list()),
    vscode.commands.registerCommand('knative.service.list', Service.list()),
    vscode.commands.registerCommand('knative.explorer.reportIssue', () =>
      KnativeExplorer.reportIssue(),
    ),
    // vscode.commands.registerCommand('knative.service.create', (context) => execute(Project.create, context)),
    KnativeExplorer.getInstance(),
  ];

  // context.subscriptions.push(disposable);
  disposable.forEach((value) => context.subscriptions.push(value));
}

// this method is called when your extension is deactivated
export function deactivate(): void {
  // do nothing
}
