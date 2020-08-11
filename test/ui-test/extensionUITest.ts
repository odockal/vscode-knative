/* eslint-disable func-names */
import { expect } from 'chai';
import { ActivityBar, SideBarView, ViewControl, ExtensionsViewSection, ExtensionsViewItem } from 'vscode-extension-tester';
import { KNativeConstants } from './common/contants';
/**
 * @author Ondrej Dockal <odockal@redhat.com>
 */
export function extensionsUITest(): void {
  describe('Knative extension', () => {
    let view: ViewControl;
    let sideBar: SideBarView;
    let section: ExtensionsViewSection;

    beforeEach(async function () {
      this.timeout(5000);
      view = new ActivityBar().getViewControl('Extensions');
      sideBar = await view.openView();
      section = (await sideBar.getContent().getSection('Enabled')) as ExtensionsViewSection;
    });

    it('should also install dependent Kubernetes extension', async function () {
      this.timeout(5000);
      const item = await section.findItem(`@installed ${KNativeConstants.KUBERNETES_EXTENSION_NAME}`);
      expect(item).to.be.an.instanceOf(ExtensionsViewItem);
      expect(await item.getTitle()).to.equal(KNativeConstants.KUBERNETES_EXTENSION_NAME);
    });

    it('should be installed among extensions', async function () {
      this.timeout(5000);
      const item = await section.findItem(`@installed ${KNativeConstants.KNATIVE_EXTENSION_NAME}`);
      expect(item).to.be.an.instanceOf(ExtensionsViewItem);
      expect(await item.getTitle()).to.equal(KNativeConstants.KNATIVE_EXTENSION_NAME);
    });

    afterEach(async function () {
      this.timeout(5000);
      if (sideBar && (await sideBar.isDisplayed())) {
        sideBar = await new ActivityBar().getViewControl('Extensions').openView();
        const titlePart = sideBar.getTitlePart();
        const actionButton = await titlePart.getAction('Clear Extensions Search Results');
        if (await actionButton.isEnabled()) {
          await actionButton.click();
        }
      }
    });

    after(async () => {
      if (sideBar && (await sideBar.isDisplayed())) {
        await view.closeView();
      }
    });
  });
}
