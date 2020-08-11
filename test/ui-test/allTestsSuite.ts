// import { downloadAndUnzipVSCode } from 'vscode-test';
// import { execSync } from 'child_process';
// import { dirname, join } from 'path';
// import { platform } from 'os';
import { extensionsUITest } from './extensionUITest';

/**
 * @author Ondrej Dockal <odockal@redhat.com>
 */
describe('VSCode KNative Extension - UI tests', () => {
  // before('Install dependencies', function installDeps() {
  //   downloadAndUnzipVSCode().then((executable: string): void => {
  //     let exe: string = executable;
  //     if (platform() === 'darwin') {
  //       exe = `'${join(exe.substring(0, exe.indexOf('.app') + 4), 'Contents', 'Resources', 'app', 'bin', 'code')}'`;
  //     } else {
  //       exe = join(dirname(exe), 'bin', 'code');
  //     }
  //     execSync(`${exe} --install-extension ms-kubernetes-tools.vscode-kubernetes-tools`);
  //   });
  // });
  extensionsUITest();
});
