import UiuxConfig from "../../../configs/fixed-configs/UiuxConfig";
import HTMLComponent from "../../HtmlComponent";
import ArrowComponent from "../arrows/ArrowComponent";

class AddMoreValuesBtn extends HTMLComponent{
    frontArrow= new ArrowComponent(this,UiuxConfig.COMPONENT_ARROW_FRONT)
    backArrow = new ArrowComponent(this, UiuxConfig.COMPONENT_ARROW_BACK)
    callBack: ()=>void;

    constructor(ParentComponent:HTMLComponent,callBack:()=>void){
        super('AddMoreValuesBtn',ParentComponent,null)
        this.callBack = callBack
    }

    render(): this {
        super.render()
        this.backArrow.render()
        let widgetHtml = $(`<p><span>+</span></p>`)
        this.html.append(widgetHtml)
        this.frontArrow.render()
        this.#addEventListener(widgetHtml)
        return this
    }

    #addEventListener(widgetHtml:JQuery<HTMLElement>){
        widgetHtml[0].addEventListener('click',()=>{
            this.callBack()
        })
    }
}
export default AddMoreValuesBtn