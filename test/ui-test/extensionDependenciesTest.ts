/* eslint-disable no-unused-expressions */
/* eslint-disable no-console */
/* eslint-disable func-names */
import { expect } from 'chai';
import {
  ActivityBar,
  NotificationType,
  VSBrowser,
  NotificationsCenter,
  BottomBarPanel,
  Workbench,
} from 'vscode-extension-tester';
import { safeNotificationExists, getNotifications, notificationExistsWithObject } from './common/testUtils';

const HELM_NOTIFICATION_ERROR = 'Could not find Helm binary';
const KUBECTL_NOTIFICATION_ERROR = 'Kubectl not found';
const KUBECTL_COMMAND_FAILED = 'Kubectl command failed';
/**
 * @author Ondrej Dockal <odockal@redhat.com>
 */
export function extensionsUITest(): void {
  describe('Knative/Kubernetes extension dependecies', () => {
    it('should be installed at once', async function () {
      this.timeout(20000);
      const control = new ActivityBar().getViewControl('Kubernetes');
      await control.openView();
      await VSBrowser.instance.driver.wait(() => {
        return safeNotificationExists(KUBECTL_NOTIFICATION_ERROR);
      }, 5000);
      const resultArray = await Promise.all(
        (await getNotifications(NotificationType.Any)).map(async (item) => {
          const message = await item.getMessage();
          return message;
        }),
      );
      expect(resultArray.some((item) => item.includes(HELM_NOTIFICATION_ERROR))).to.be.true;
      expect(resultArray.some((item) => item.includes(KUBECTL_NOTIFICATION_ERROR))).to.be.true;
      expect(resultArray.some((item) => item.includes(KUBECTL_COMMAND_FAILED))).to.be.true;
      const helmNotification = await notificationExistsWithObject(HELM_NOTIFICATION_ERROR);
      const buttonInstall = (await helmNotification.getActions()).filter(async (item) => {
        const button = await item.getText();
        return button === 'Install dependencies';
      });
      await buttonInstall[0].click();
      await new NotificationsCenter().clearAllNotifications();
      await control.openView();
      await VSBrowser.instance.driver.wait(async () => {
        const exists = await getNotifications(NotificationType.Any);
        return exists;
      }, 5000);
      const notifications = await getNotifications(NotificationType.Any);
      expect(notifications.length).to.equal(0);
      // check output for deps installed by helm
      const outputView = await new BottomBarPanel().openOutputView();
      const text = await outputView.getText();
      console.log(text);
      expect(text).to.include('Installing Helm');
      expect(text).to.include('Installing kubectl');
      expect(text).to.include('Installing Draft');
      expect(text).to.include('Installing Minikube');
    });

    afterEach(async function () {
      this.timeout(5000);
      await (await new Workbench().openNotificationsCenter()).clearAllNotifications();
    });
  });
}
