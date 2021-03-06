function validate(binding) {
  if (typeof binding.value !== 'function') {
    console.warn('[Vue-click-outside:] provided expression', binding.expression, 'is not a function.')
    return false
  }

  return true
}

function iePath(evt) {
  var path = (evt.composedPath && evt.composedPath()) || evt.path,
      target = evt.target;

  if (path != null) {
      // Safari doesn't include Window, but it should.
      return (path.indexOf(window) < 0) ? path.concat(window) : path;
  }

  if (target === window) {
      return [window];
  }

  function getParents(node, memo) {
      memo = memo || [];
      var parentNode = node.parentNode;

      if (!parentNode) {
          return memo;
      }
      else {
          return getParents(parentNode, memo.concat(parentNode));
      }
  }

  return [target].concat(getParents(target), window);
}

function isPopup(popupItem, elements) {
  if (!popupItem || !elements)
    return false

  for (var i = 0, len = elements.length; i < len; i++) {
    try {
      if (popupItem.contains(elements[i])) {
        return true
      }
      if (elements[i].contains(popupItem)) {
        return false
      }
    } catch(e) {
      return false
    }
  }

  return false
}

function isServer(vNode) {
  return typeof vNode.componentInstance !== 'undefined' && vNode.componentInstance.$isServer
}

exports = module.exports = {
  bind: function (el, binding, vNode) {
    if (!validate(binding)) return

    // Define Handler and cache it on the element
    function handler(e) {
      if (!vNode.context) return

      binding.args = binding.args || {}
      const isActive = (binding.args.closeConditional || function() { return true; })
      if (!e || isActive(e) === false) return;

      // some components may have related popup item, on which we shall prevent the click outside event handler.
      var elements = iePath(e);
      elements && elements.length > 0 && elements.unshift(e.target)
      
      if (el.contains(e.target) || isPopup(vNode.context.popupItem, elements)) return

      el.__vueClickOutside__.callback(e)
    }

    // add Event Listeners
    el.__vueClickOutside__ = {
      handler: handler,
      callback: binding.value
    }
    !isServer(vNode) && document.addEventListener('click', handler)
  },

  update: function (el, binding) {
    if (validate(binding)) el.__vueClickOutside__.callback = binding.value
  },
  
  unbind: function (el, binding, vNode) {
    // Remove Event Listeners
    !isServer(vNode) && document.removeEventListener('click', el.__vueClickOutside__.handler)
    delete el.__vueClickOutside__
  }
}
