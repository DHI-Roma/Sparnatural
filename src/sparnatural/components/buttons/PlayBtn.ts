import UiuxConfig from "../../../configs/fixed-configs/UiuxConfig";
import HTMLComponent from "../../HtmlComponent";

class PlayBtn extends HTMLComponent {
  constructor(ParentComponent: HTMLComponent, callBack: () => void) {
    //TODO submit enable disable as binary state
    let widgetHtml = $(`${UiuxConfig.ICON_PLAY}`);
    super("playBtn", ParentComponent, widgetHtml);
    this.html.on("click", (e: JQuery.ClickEvent) => {
      callBack();
    });
  }

  render(): this {
    super.render();
    return this;
  }
}
export default PlayBtn;
