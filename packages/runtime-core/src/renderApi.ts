interface RenderApi {
    hostInsert: Function
    hostRemove: Function
    hostSetElementText: Function
    hostSetText: Function
    hostParentNode: Function
    hostNextSibling: Function
    hostCreateElement: Function
    hostCreateText: Function
    hostPatchProp: Function
}

function createRenderApi(renderOptions : any) : RenderApi {
    const renderApi = {
        hostInsert : renderOptions["insert"],
        hostRemove: renderOptions["remove"],
        hostSetElementText: renderOptions["setElementText"],
        hostSetText: renderOptions["setText"],
        hostParentNode: renderOptions["parentNode"],
        hostNextSibling: renderOptions["nextSibling"],
        hostCreateElement: renderOptions["createElement"],
        hostCreateText: renderOptions["createText"],
        hostCreateComment: renderOptions["createComment"],
        hostPatchProp: renderOptions["patchProp"],
    }
    return renderApi
}