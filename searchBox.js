(function() {
    var Browser = (function() {
        return {
            isIE: false,
            isChrome: true
        }
    }());

    var Events = (function() {
        var addHandler = Browser.isIE ? window.attachHandler : window.addEventListener;
        // var removeHandler = Browser.isIE ? window.detachHandler : window.removeEventListener;
        return {
            addHandler: function(el, events, eventhandler) {
                    events = Object.prototype.toString.call(events) === '[object Array]' ? events : [events]
                    for (var i = 0, n = events.length; i < n; i++) {
                        addHandler.call(el, events[i], eventhandler);
                    }
                }
                // removeHandler: removeHandler
        }
    }());

    var Utils = (function() {
        var debounce = function(func, wait, immediate) {
            var timeout;
            return function() {
                var context = this,
                    args = arguments;
                var later = function() {
                    timeout = null;
                    if (!immediate) func.apply(context, args);
                };
                var callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                if (callNow) func.apply(context, args);
            };
        };
        var isEmpty = function(el) {
            if (typeof el == "string") {
                if (el.trim().length > 0) {
                    return false;
                }
                return true;
            }
        }

        return {
            debounce: debounce,
            isEmpty: isEmpty
        }
    }());

    function SearchDB(data, options) {
        var data_key = [],
            data_value = [];
        var isCaseSensitive = options && options.isCaseSensitive;

        // function init() {
        for (var i in data) {
            data_key.push(i);
        }
        data_key.sort();
        for (var i = 0, n = data_key.length; i < n; i++) {
            data_value[i] = data[data_key[i]];
        }
        // }

        function searchIterator(key) {
            var currentIndex = 0,
                next,
                reset;
            key = key || "";
            next = function() {
                var index;
                while (currentIndex < data_key.length) {
                    index = indexOf(data_key[currentIndex], key);
                    if (index >= 0) {
                        break;
                    }
                    currentIndex++;
                }
                if (currentIndex < data_key.length) {
                    var result = {
                        start: index,
                        end: index + key.length,
                        d: data_key[currentIndex],
                        v: data_value[currentIndex]
                    }
                    currentIndex++;
                    return result;
                }
                return null;
            }
            reset = function() {
                currentIndex = 0;
            }

            return {
                next: next,
                reset: reset
            }
        };

        function search(key) {
            var results = [];
            for (var i = 0, n = data_key.length; i < n; i++) {
                var index = indexOf(data_key[i], key);
                if (index >= 0) {
                    results.push({
                        start: index,
                        end: index + key.length,
                        d: data_key[i],
                        v: data_value[i]
                    })
                }
            }
            return results;
        }

        function indexOf(key1, key2) {
            if (!isCaseSensitive) {
                return key1.toLowerCase().indexOf(key2.toLowerCase());
            }
            return key1.indexOf(key2);
        }

        function getValue(key) {
                return data_value[key];
            }
            // init();
        return {
            iterator: searchIterator,
            search: search,
            getValue: getValue
        }
    }

    function SearchInput(sb) {
        var si = this;
        si.sb = sb;
        var hEl = document.createElement("input");
        hEl.setAttribute("class", "searchinput");
        hEl.setAttribute("type", "text");
        var context = this;
        var _onC_debounced = Utils.debounce(function(event) {
            context._onChange(event);
        }, 300);
        Events.addHandler(hEl, ["focus", "keydown"], _onC_debounced); //No I18N
        Events.addHandler(hEl, "keydown", function(e) { //No I18N
            return si._onKey(e);
        });
        si.hEl = hEl;
        return si;
    };
    SearchInput.prototype._onChange = function(e) {
        if (e.keyCode == '37' || e.keyCode == '38' || e.keyCode == '39' || e.keyCode == '40' || e.keyCode == '13' || e.keyCode == '27') {
            return;
        }
        var key = this.hEl.value,
            sb = this.sb;
        if (Utils.isEmpty(key)) {
            sb.fire("clear");
            sb.hideResults();
            return;
        }
        sb.search(key);
    };
    SearchInput.prototype._onKey = function(e) {
        if (e.keyCode == '38' || e.keyCode == '40') {
            e.preventDefault();
            e.keyCode == '38' ? this.sb.moveSelUp() : this.sb.moveSelDown();
        }
        if (e.keyCode == '13') {
            e.preventDefault();
            this.sb.onSelect();
        }
        if(e.keyCode=='27')
        {
            this.hEl.blur();
            this.sb.hideResults();
        }
    };
    SearchInput.prototype.setValue = function(v){
        this.hEl.value = v;
    }


    function SearchResult(sb) {
        var sr = this;
        sr.sb = sb;
        sr.reset();
        var hEl = document.createElement("div");
        hEl.setAttribute("class", "searchresults");
        Events.addHandler(hEl, "mousemove", function(e) {//No I18N
            sr._onMove(e);
        });
        Events.addHandler(hEl, "click", function(e) {//No I18N
            sr._onSelect(e);
        })
        sr.hEl = hEl;
        sr.prevCXY = null;
        return sr;
    };
    SearchResult.prototype.noresultHEl = function(){
        var noresult = document.createElement("p");
        noresult.setAttribute("class","snoresult")
        noresult.innerHTML = "No Results";
        return noresult;
    };
    SearchResult.prototype._onSelect = function(e) {
        var srcEl = e.target || e.srcElement;
        if (srcEl.tagName == "LI") {
            this.sb.onSelect();
        }
    };
    SearchResult.prototype._onMove = function(e) {
        var prevCXY = this.prevCXY;
        if(prevCXY!=null && prevCXY.clientX == e.clientX && prevCXY.clientY == e.clientY)
        {
            return;
        }
        this.prevCXY = {
            clientX : e.clientX,
            clientY : e.clientY
        }
        var srcEl = e.target || e.srcElement;
        if (srcEl.tagName == "LI") {
            this.setCurEl(srcEl);
        }
    };
    SearchResult.prototype.add = function(sresult) {
        var srlist = this.srlist;
        var d = sresult.d,
            stIdx = sresult.start,
            eIdx = sresult.end,
            fPart = stIdx > 0 ? d.substring(0, stIdx) : "",
            mPart = d.substring(stIdx, eIdx),
            lPart = eIdx < d.length ? d.substring(eIdx) : "";
        var li = document.createElement("li");
        li.setAttribute("class", "sresult");
        li.__searchresult__ = sresult;
        li.innerHTML = fPart + "<span class='highlight'>" + mPart + "</span>" + lPart;
        srlist.appendChild(li);
        this.srlist_size++;
    };
    SearchResult.prototype.reset = function() {
        this.srlist = document.createElement("ul");
        this.srlist_size = 0;
        this.curEl = null;
    };
    SearchResult.prototype.setCurEl = function(el) {
        var curEl = this.curEl;
        if (el === curEl) return;
        curEl != null && curEl.setAttribute("class", "sresult");
        el.setAttribute("class", "sresult hover");
        this.curEl = el;
    };
    SearchResult.prototype.up = function() {
        if(this.isNoResult())
        {
            return;
        }
        var els = this.srlist.children,
            curEl = this.curEl;
        var el = (curEl == null || curEl.previousSibling == null) ? els[els.length - 1] : curEl.previousSibling;
        this.setCurEl(el);
        this.updateScroll();
    };
    SearchResult.prototype.down = function() {
        if(this.isNoResult())
        {
            return;
        }
        var els = this.srlist.children,
            curEl = this.curEl;
        var el = (curEl == null || curEl.nextSibling == null) ? els[0] : curEl.nextSibling;
        this.setCurEl(el);
        this.updateScroll();
    };
    SearchResult.prototype.updateScroll = function() {
        var curEl = this.curEl;
        var elSTop = curEl.offsetTop-this.hEl.offsetTop;
        var srSTop  = this.hEl.scrollTop;
        var h = this.hEl.offsetHeight;
        if(elSTop < srSTop)
        {
            this.hEl.scrollTop=elSTop;
        }
        else if((elSTop+curEl.offsetHeight)>=(srSTop+h))
        {
            this.hEl.scrollTop+=elSTop+curEl.offsetHeight-(srSTop+h)
        }
    };
    SearchResult.prototype.show = function() {
        var hEl = this.hEl;
        hEl.innerHTML = "";
        if(this.isNoResult()){
            hEl.appendChild(this.noresultHEl());
        }
        else {
            hEl.appendChild(this.srlist);
        }
        hEl.style.display = "block";
    };
    SearchResult.prototype.hide = function() {
        this.hEl.style.display = "none";
    }
    SearchResult.prototype.isNoResult = function(){
        return this.srlist_size <=0;
    }

    SearchBox = function(data, callback, args, context) {
        var sb, si, sr, sdb,
            sb = this;
        context = context || window;
        si = new SearchInput(sb);
        sr = new SearchResult(sb);
        sdb = SearchDB(data);
        sb.sdb = sdb;
        sb.si = si;
        sb.sr = sr;
        sb.hideListener = null;
        this.callUserCallBack = function(result) {
            callback.apply(context, [result, args]);
        };
        this.topics = {
            "clear" : []
        };
        var hEl = document.createElement("div");
        hEl.setAttribute("class", "module-searchbox");
        hEl.appendChild(si.hEl);
        hEl.appendChild(sr.hEl);
        hEl.on = function(topic,fn,args,context){
            sb.on(topic,fn,args,context);
        };
        hEl.off = function(topic,fn){
            sb.off(topic,fn);
        };
        hEl.clear = function(){
            sb.clear();
        }
        return hEl;
    }

    SearchBox.prototype.search = function(key) {
        var searchIterator = this.sdb.iterator(key);
        var sr = this.sr;
        sr.reset();
        var sresult;
        while (1) {
            sresult = searchIterator.next();
            if (sresult == null) break;
            sr.add(sresult);
        }
        this.showResutls();
    }

    SearchBox.prototype.hideResults = function(searchBoxResults) {
        this.sr.hide();
    }

    SearchBox.prototype.showResutls = function(resultsHtml) {
        this.sr.show();
        if(this.hideListener!=null)
        {
            document.body.removeEventListener("click", this.hideListener, false);
        }
        var context = this;
        this.hideListener = function() {
            context.hideResults();
            document.body.removeEventListener("click", context.hideListener, false);
            context.hideListener = null;
        };
        document.body.addEventListener("click", context.hideListener, false);
    }

    SearchBox.prototype.moveSelDown = function() {
        this.sr.down();
    }

    SearchBox.prototype.moveSelUp = function() {
        this.sr.up();
    }

    SearchBox.prototype.onSelect = function() {
        var curEl = this.sr.curEl;
        if (curEl != null) {
            var result = curEl.__searchresult__;
            this.setValue(result.d);
            this.hideResults();
            this.callUserCallBack(result);
        }
    }

    SearchBox.prototype.setValue = function(v) {
        this.si.setValue(v);
    }

    SearchBox.prototype.clear = function() {
        this.setValue("");
        this.hideResults();
        this.fire("clear");
    }

    SearchBox.prototype.on = function(topic,fn,args,context){
        if (typeof this.topics[topic] === "undefined") {
            return;
        }
        this.topics[topic].push({
            fn: fn,
            args: args,
            context: context
        });
        return fn;
    };

    SearchBox.prototype.off = function(topic,fn){
        var subscribers = this.topics[topic];
        if (!subscribers) {
            return;
        };
        for(var i=0,n=subscribers.length;i<n;i++){
            if(subscribers[i].fn === fn){
                subscribers.splice(i,1);
                break;
            }
        }
    };

    SearchBox.prototype.fire = function(topic) {
        var subscribers = this.topics[topic];
        if (!subscribers) {
            return;
        };
        for (var i = 0, n = subscribers.length; i < n; i++) {
            var curSubscriber = subscribers[i];
            curSubscriber.fn.apply(curSubscriber.context, curSubscriber.args);
        }
    };
}())
