if (process.versions['electron'] === undefined) {
  var zmq = require('..')
    , should = require('should');

  it('should cooperate with gc', function(done){
    var a = zmq.socket('dealer')
      , b = zmq.socket('dealer');

    /**
     * We create 2 dealer sockets.
     * One of them (`a`) is not referenced explicitly after the main loop
     * finishes so it's a pretender for garbage collection.
     * This test performs gc() explicitly and then tries to send a message
     * to a dealer socket that could be destroyed and collected.
     * If a message is delivered, than everything is ok. Otherwise the guard
     * timeout will make the test fail.
     */
    a.on('message', function(msg){
      msg.should.be.an.instanceof(Buffer);
      msg.toString().should.equal('hello');
      this.close();
      b.close();
      clearTimeout(timeout);
      done();
    });

    var bound = false;

    a.bind('tcp://127.0.0.1:5555', function(e){
      if (e) {
        clearInterval(interval);
        done(e);
      } else {
        bound = true;
      }
    });

    var interval = setInterval(function(){
      gc();
      if (bound) {
        clearInterval(interval);
        b.connect('tcp://127.0.0.1:5555');
        b.send('hello');
      }
    }, 100);

    // guard against hanging
    var timeout = setTimeout(function(){
      clearInterval(interval);
      done(new Error('timeout of 5000ms exceeded (bound: ' + bound + ')'));
    }, 15000);
  });
} else {
  console.log('Running in electron: GC test skipped.');
}
