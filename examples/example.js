(function() {
  // Reusing code for different views
  var template = function(id) {
    console.log('Rendered ' + id);
    this.demo = function(msg) {
      // This is a public method that can be called from outside
      // Content.call("ex1", "demo", "A message")
      alert("Message from " + id + ": " + msg);
    }
    this.btnPressed = function(event) {
      this.demo('Button pressed!');
    }
    this.onEnter = function(event) {
      console.log('Enter was called on ' + id);
    }
    Content.registerEvents(id, {
      "click .demoBtn": "btnPressed",
      "enter": "onEnter"
    });
    // 'this' should refer to a content object
    // this.el = to div#ex1
    if (id === 'ex1') {
      this.el.innerHTML = '<h2>I was dynamically updated!</h2><p><button class="demoBtn">Click me</button></p>';
    }
    
    // Out-of-view => In-view
    // Content.on('enter', id, function() {
    //   this.onEnter();
    // });
    
    // In-view -> Out-of-view
    // Content.on('exit', id, function() {});
  }
  // if (window.Content) {
    window.Content && Content.on('render', 'ex1', template);
    window.Content && Content.on('render', 'ex2', template);
  // }
}())