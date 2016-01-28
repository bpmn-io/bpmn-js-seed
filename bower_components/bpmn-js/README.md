# bpmn-js (pre-packaged version)

This is a packaged version of [bpmn-js](https://github.com/bpmn-io/bpmn-js) for standalone usage or via [bower](http://bower.io).


## Usage

Fetch the dependency via `bower install bpmn-js` or download individual files from the [dist folder](https://github.com/bpmn-io/bower-bpmn-js/tree/master/dist).

Include the file into your project

```html
<!-- dependencies ... -->

<!-- bpmn-js -->
<script src="bower_components/bpmn-js/dist/bpmn-viewer.js"></script>

<script>
  // require is part of bundle file
  var BpmnViewer = window.BpmnJS;

  var xml; // ADD BPMN 2.0 XML HERE
  var viewer = new BpmnViewer({ container: 'body' });

  viewer.importXML(xml, function(err) {

    if (err) {
      console.log('error rendering', err);
    } else {
      console.log('rendered');
    }
  });
</script>
```


Checkout the [examples repository](https://github.com/bpmn-io/bpmn-js-examples) for a complete example of [how to use bpmn-js with bower](https://github.com/bpmn-io/bpmn-js-examples/tree/master/simple-bower).


## License

Use under the terms of the [bpmn-js license](http://bpmn.io/license).
