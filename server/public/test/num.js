describe('Array', function(){
  describe('#num()', function(){
    it('should append a value', function(){
      foo = 'fdsfdsf'
      var arr = [];
      arr.push('foo');
      arr.push('bar');
      arr.push('baz');
        assert('foo' == arr[0]); // to test indentation
        assert('bar' == arr[1]);
      assert('baz' == arr[2]);
    })

    it('should return the length', function(){
      var arr = [];
      assert(1 == arr.push('foo'));
      assert(2 == arr.push('bar'));
      assert(3 == arr.push('baz'));
    })
  })
})
