
// Since objects only compare === to the same object (i.e. the same reference)
// we can do something like this instead of using integer enums because we can't
// ever accidentally compare these to other values and get a false-positive.
//
// For instance, `rejected === resolved` will be false, even though they are
// both {}.
var rejected = {}, resolved = {}, waiting = {};

// This is a promise. It's a value with an associated temporal
// status. The value might exist or might not, depending on
// the status.
var Promise = function (value, status) {
  this.value = value;
  this.status = 'pending';
  this.success = [];
  this.catches = [];
};

// The user-facing way to add functions that want
// access to the value in the promise when the promise
// is resolved.
Promise.prototype.then = function (success, _failure) {
  if (success){
    this.success.push(success);
  }
  if (_failure){
    this.catches.push(_failure);
  }
  return this;
};


// The user-facing way to add functions that should fire on an error. This
// can be called at the end of a long chain of .then()s to catch all .reject()
// calls that happened at any time in the .then() chain. This makes chaining
// multiple failable computations together extremely easy.
Promise.prototype.catch = function (failure) {
  this.catches.push(failure);
};



// This is the object returned by defer() that manages a promise.
// It provides an interface for resolving and rejecting promises
// and also provides a way to extract the promise it contains.
var Deferred = function (promise) {
  this.promise = promise;
};

// Resolve the contained promise with data.
//
// This will be called by the creator of the promise when the data
// associated with the promise is ready.
Deferred.prototype.resolve = function (data) {
  this.promise.status = 'resolved';
  this.promise.value = data;
  this.promise.success.pop()(data);
  if (this.promise.catches.length) { this.promise.catches.pop(); }
};

// Reject the contained promise with an error.
//
// This will be called by the creator of the promise when there is
// an error in getting the data associated with the promise.
Deferred.prototype.reject = function (error) {
  this.promise.status = 'rejected';
  this.promise.value = error;
  this.promise.catches.pop()(error);
  if (this.promise.success.length) { this.promise.success.pop(); }
};

// The external interface for creating promises
// and resolving them. This returns a Deferred
// object with an empty promise.
var defer = function () {
  var deferred = new Deferred(new Promise());
  return deferred;
};


module.exports.defer = defer;

module.exports.promisify = function(func){
  var deferred = defer();
  return function(num){
    func(num, function(failure, success){
      if (success){
        deferred.resolve(success);
      }
      if (failure){
        deferred.reject(failure);
      }
    });

    return deferred.promise;
  }
}



