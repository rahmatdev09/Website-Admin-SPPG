(function(global) {
    function ImageModule(options) {
        this.options = options || {};
        if (!(this instanceof ImageModule)) return new ImageModule(options);
    }
    ImageModule.prototype.set = function(obj) {
        if (obj.inspect) { this.imgManager = obj.inspect.imgManager; }
    };
    ImageModule.prototype.handle = function(type, data) { return null; };
    ImageModule.prototype.render = function(part, options) {
        if (part.type !== "placeholder" || part.module !== "image") return null;
        const tagValue = options.scopeManager.getValue(part.value, options.context);
        if (!tagValue) return { value: "" };
        const imgBuffer = this.options.getImage(tagValue, part.value);
        const size = this.options.getSize(imgBuffer, tagValue, part.value);
        const rId = this.imgManager.addImage(imgBuffer);
        return {
            value: '<w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="' + (size[0] * 9525) + '" cy="' + (size[1] * 9525) + '"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="1" name="Image"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="0" name="Picture"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId' + rId + '"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + (size[0] * 9525) + '" cy="' + (size[1] * 9525) + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing>'
        };
    };
    global.ImageModule = ImageModule;
})(window);
