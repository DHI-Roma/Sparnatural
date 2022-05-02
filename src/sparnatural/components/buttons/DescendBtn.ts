import UiuxConfig from "../../../configs/fixed-configs/UiuxConfig";
import HTMLComponent from "../../HtmlComponent";


class DescendBtn extends HTMLComponent{
    selected:boolean = false
    constructor(ParentComponent:HTMLComponent, callBack:()=>void){
        let widgetHtml = $(UiuxConfig.ICON_ZA);
        super("asc",ParentComponent,widgetHtml)
        // add clicklistener
        this.widgetHtml.on('click',(e:JQuery.ClickEvent)=>{
            this.selected = this.selected ? false:true
            this.selected ? this.html.addClass('selected') : this.html.removeClass('selected')
            callBack()
        })
    }

    render(): this {
        super.render()
        return this
    }    
}
export default DescendBtn