"use strict";

var cons = _.cons;

var ourCons = function (first, rest) {
        return [first].concat(rest);
      };

var theEmptyList = [];

var first = _.first;

var rest = _.rest;

var force = function (f) {
      return f();
    };

var consStream = cons;

var memoProc = function (f) {
  var wasAlreadyRun = false,
      result;

  return function () {
    if (_.not(wasAlreadyRun)) {
      result = f();
      wasAlreadyRun = true;
    }
    return result;
  };
};

var consStream = function (head, tail) {
  return cons(head, memoProc(tail));
};

var head = first;

var tail = _.compose(force, first, rest);

var theEmptyStream = [];

var isEmptyStream = function (stream) {
  return _.isEmpty(stream);
};

var nthStream = function (n, stream) {
  if (_.isZero(n)) return head(stream);
  return nthStream(n - 1, tail(stream));
};

var integersStartingFrom = function (n) {
  return consStream(n,
                    function () {
                      return integersStartingFrom(n + 1);
                    });
};

var natNumsFromGen = integersStartingFrom(1);

var fibonacciGenerator = function (a, b) {
  return consStream(a,
                    function () {
                      return fibonacciGenerator(b, a + b);
                    });
};

var fibsFromGen = fibonacciGenerator(0, 1);

var filterStream = function (predicate, stream) {
  if (isEmptyStream(stream)) return theEmptyStream;
  if (predicate(head(stream))) return consStream(head(stream),
                                                 function () {
                                                   return filterStream(predicate, tail(stream));
                                                 });
  return filterStream(predicate, tail(stream));
};

var isDivisible = function (number, divisor) {
  return _.isZero(_.mod(number, divisor));
};

var sieve = function (stream) {
  return consStream(head(stream),
                    function () {
                      return sieve(filterStream(function (x) {
                                                  return _.not(isDivisible(x, head(stream)));
                                                },
                                                tail(stream)));
                    });
};

var primesFromGen = sieve(integersStartingFrom(2));

var ones = (function () {
  return consStream(1,
                    function () {
                      return ones;
                    });
}());

var addStreams = function (s1, s2) {
  if (isEmptyStream(s1)) return s2;
  if (isEmptyStream(s2)) return s1;
  return consStream(head(s1) + head(s2),
                    function () {
                      return addStreams(tail(s1), tail(s2));
                    });
};

var natNums = (function () {
  return consStream(1,
                    function () {
                      return addStreams(ones, natNums);
                    });
}());

var fibs = (function () {
  return consStream(0,
                    function () {
                      return consStream(1,
                                        function () {
                                          return addStreams(tail(fibs), fibs);
                                        });
                    });
}());

var square = function (n) {
  return Math.pow(n, 2);
};

var isPrime = function (n) {
  function loop(ps) {
    if (square(head(ps)) > n) return true;
    if (isDivisible(n, head(ps))) return false;
    return loop(tail(ps));
  }

  return loop(primes);
};

var primes = consStream(2,
                        function () {
                          return filterStream(isPrime, integersStartingFrom(3));
                        });

var findSmallestDivisorOfNotLessThan = function (n, testDivisor) {
  if (square(testDivisor) > n) return n;
  if (isDivisible(n, testDivisor)) return testDivisor;
  return findSmallestDivisorOfNotLessThan(n, testDivisor + 1);
};

var smallestDivisorOf = function (n) {
  return findSmallestDivisorOfNotLessThan(n, 2);
};

var isPrime2 = function (n) {
  return n === smallestDivisorOf(n);
};

var nthPrimeInInterval = function (n, min, max) {
  var i = min,
      prime,
      numberOfPrimesFound = 0;

  for (; i <= max && numberOfPrimesFound < n; i++) {
    if (isPrime2(i)) {
      prime = i;
      numberOfPrimesFound += 1;
    }
  }

  if (numberOfPrimesFound < n) {
    return ["Only found ", n, " primes in interval [", min, ", ", max, "]."].join("");
  }
  return prime;
};

var enumerateInterval = function (min, max, step) {
  if(_.isUndefined(step)) step = 1;

  if (min > max) return theEmptyStream;
  return consStream(min,
                    function () {
                      return enumerateInterval(min + step, max, step)
                    });
};

var mapStream = function (f, stream) {
  if (isEmptyStream(stream)) return theEmptyStream;
  return consStream(f(head(stream)),
                    function () {
                      return mapStream(f, tail(stream));
                    });
};

var scaleStream = function (scalar, stream) {
  return mapStream(function (x) { return scalar * x; }, stream);
};

var integral = function (integrand, initialValue, deltaT) {
  function int() {
    return consStream(initialValue,
                      function () {
                        return addStreams(scaleStream(deltaT, integrand),
                                          int());
                      });
  }

  return int();
};

var benchmarkRun = function (f /*, arguments */) {
  var start,
      end,
      timeMessage,
      fResult;

  start = Date.now();
  fResult = f.apply(f, _.rest(arguments));
  end = Date.now();

  return end - start;
};

var add = function (x, y) {
  return x + y;
};

var benchmark = function (numberOfRuns, f) {
  var results = _.map(_.range(numberOfRuns),
                      function () { return benchmarkRun(f); }),
      averageTime = _.reduce(results, add, 0) / _.size(results),
      fResult = f();

  return ["result: ", fResult, "\n", "average time: ", averageTime].join("");
};

