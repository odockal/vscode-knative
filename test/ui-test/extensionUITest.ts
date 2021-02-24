import { expect } from 'chai';
import {
  ActivityBar,
  ExtensionsViewSection,
  ExtensionsViewItem,
  ViewControl,
  SideBarView,
  WebDriver,
  VSBrowser,
} from 'vscode-extension-tester';
import { DialogHandler } from 'vscode-extension-tester-native';
import { KNativeConstants } from './common/constants';
import { cleanUpNotifications, findNotification, safeNotificationExists } from './common/testUtils';
/**
 * @author Ondrej Dockal <odockal@redhat.com>
 */
export function extensionsUITest(): void {
  let driver: WebDriver;

  before(() => {
    driver = VSBrowser.instance.driver;
  });

  describe('Knative extension', () => {
    it('should be installed among extensions', async function context() {
      this.timeout(10000);
      const view = new ActivityBar().getViewControl('Extensions');
      const sideBar = await view.openView();
      const section = (await sideBar.getContent().getSection('Installed')) as ExtensionsViewSection;
      const item = await driver.wait(async () => section.findItem(`@installed ${KNativeConstants.KNATIVE_EXTENSION_NAME}`), 3000);
      expect(item).to.be.an.instanceOf(ExtensionsViewItem);
      expect(await item.getTitle()).to.equal(KNativeConstants.KNATIVE_EXTENSION_NAME);
    });
    describe('dependencies', () => {
      it('Yaml, should be installed among extensions', async function context() {
        this.timeout(10000);
        const view = new ActivityBar().getViewControl('Extensions');
        const sideBar = await view.openView();
        const section = (await sideBar.getContent().getSection('Installed')) as ExtensionsViewSection;
        const item = await driver.wait(async () => section.findItem(`@installed ${KNativeConstants.YAML_EXTENSION_NAME}`), 3000);
        expect(item).to.be.an.instanceOf(ExtensionsViewItem);
        expect(await item.getTitle()).to.equal(KNativeConstants.YAML_EXTENSION_NAME);
      });
    });

    afterEach(async function afterContext() {
      this.timeout(8000);
      const sideBar = await new ActivityBar().getViewControl('Extensions').openView();
      const titlePart = sideBar.getTitlePart();
      const actionButton = await titlePart.getAction('Clear Extensions Search Results');
      if (await actionButton.isEnabled()) {
        await actionButton.click();
      }
    });
  });

  describe('Knative extension', () => {
    let view: ViewControl;
    let sideBar: SideBarView;

    before(async () => {
      view = new ActivityBar().getViewControl(KNativeConstants.KNATIVE_EXTENSION_NAME);
      sideBar = await view.openView();
    });

    it('Activity Bar should be available', async function context() {
      this.timeout(10000);
      expect(await sideBar.isDisplayed()).to.equal(true);
      const titlePart = sideBar.getTitlePart();
      expect(await titlePart.getTitle()).to.equal(KNativeConstants.KNATIVE_EXTENSION_BAR_NAME);
    });

    it('view should show kn cli download notification after being opened', async function context() {
      this.timeout(10000);
      await driver.wait(async () => safeNotificationExists('Cannot find Knative CLI'), 7000);
    });

    it('allows to download missing kn cli using notification', async function context() {
      this.timeout(90000);
      const notification = await driver.wait(async () => findNotification('Cannot find Knative CLI'), 5000);
      const actions = await notification.getActions();
      const actionsTexts = await Promise.all(actions.map(async (item) => item.getText()));
      const downloadActionText = actionsTexts.find((item) => (item.includes('Download') ? item : undefined));
      await notification.takeAction(downloadActionText);
      await driver.wait(async () => findNotification('Downloading Knative CLI'), 3000);
      await driver.wait(async () => {
        const exists = await safeNotificationExists('Downloading Knative CLI');
        return !exists;
      }, 80000);
    });

    it('should contain Serving and Eventing sections', async function context() {
      this.timeout(5000);
      const content = sideBar.getContent();
      const sections = await content.getSections();
      expect(sections.length).to.eq(2);
      expect(await Promise.all(sections.map(async (section) => section.getTitle()))).to.has.members([
        KNativeConstants.SECTION_EVENTING,
        KNativeConstants.SECTION_SERVING,
      ]);
    });

    describe('Serving section', () => {
      it('should provide Add service, Refresh and Report Issue action items', async function context() {
        this.timeout(10000);
        const sectionServing = await sideBar.getContent().getSection(KNativeConstants.SECTION_SERVING);
        const actions = await sectionServing.getActions();
        expect(actions.length).to.equal(3);
        actions.forEach((action) => {
          // eslint-disable-next-line max-nested-callbacks
          expect(action.getLabel()).to.satisfy((title) =>
            [
              KNativeConstants.ACTION_ITEM_ADD_SERVICE,
              KNativeConstants.ACTION_ITEM_REFRESH,
              KNativeConstants.ACTION_ITEM_REPORT_ISSUE,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, max-nested-callbacks
            ].some((expectedTitle) => title.includes(expectedTitle)),
          );
        });
      });
    });

    describe('Eventing section', () => {
      it('should provide Refresh action items', async function context() {
        this.timeout(10000);
        const sectionServing = await sideBar.getContent().getSection(KNativeConstants.SECTION_EVENTING);
        const actions = await sectionServing.getActions();
        expect(actions.length).to.equal(1);
        expect(actions[0].getLabel()).to.include(KNativeConstants.ACTION_ITEM_REFRESH);
      });
    });

    after(async function afterContext() {
      this.timeout(10000);
      // handle possible native dialog about user not logged into cluster
      try {
        const dialog = await DialogHandler.getOpenDialog();
        await dialog.confirm();
      } catch (error) {
        // no dialog appeared, no action
      }
      await cleanUpNotifications();
    });
  });
}
