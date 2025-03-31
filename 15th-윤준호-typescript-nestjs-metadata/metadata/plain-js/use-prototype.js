/**
 * Metadata 얘시2: Prototype을 활용하는 경우
 */

// 모든 함수가 'metadata' 메소드를 가지게됨 (프로토타입 상속)
Function.prototype.metadata = function (key, value) {
  if (!this._metadata) {
    this._metadata = {};
  }
  this._metadata[key] = value;
  return this;
};

function Person(name) {
  this.name = name;
}

// Prototype에 메타데이터 추가
Person.metadata("key1", "value1").metadata("key2", "value2");

// { key1: 'value1', key2: 'value2' }
console.log(Person._metadata);
