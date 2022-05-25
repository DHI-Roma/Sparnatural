import ResetBtn from "../buttons/ResetBtn";
import ComponentsList from "./ComponentsList";
import HTMLComponent from "../../HtmlComponent";
import Sparnatural from "../Sparnatural";
import ISpecProvider from "../../spec-providers/ISpecProviders";

class BgWrapper extends HTMLComponent {
  ParentSparnatural: Sparnatural;
  resetBtn: ResetBtn;
  componentsList: ComponentsList;
  specProvider: ISpecProvider;
  constructor(ParentComponent: Sparnatural, specProvider: ISpecProvider) {
    super("builder-section", ParentComponent, null);
    this.specProvider = specProvider;
  }
  render(): this {
    super.render();
    this.#renderComponents();
    return this;
  }

  #renderComponents() {
    this.componentsList = new ComponentsList(this, this.specProvider).render();
    this.resetBtn = new ResetBtn(this, this.resetCallback).render();
  }

  resetCallback = () => {
    this.componentsList.html.empty();
    this.componentsList.html.remove();
    this.resetBtn.html.empty();
    this.resetBtn.html.remove();
    this.#renderComponents();
  };
}
export default BgWrapper;
