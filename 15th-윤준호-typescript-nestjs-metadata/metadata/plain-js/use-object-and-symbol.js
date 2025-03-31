/**
 * Metadata 예시1: 객체 프로퍼티를 활용하는 경우
 * Symbol 은 생성자가 symbol 원시 값을 반환하는 내장 객체이다.
 * symbol은 고유함이 보장된다.
 */

// Object
const user = {
  name: "Junho",
  age: 27,
  metadata: {
    role: ["user"],
    created: "1999-08-15",
  },
};

const metadataSymbol = Symbol("metadata");

class Person {
  constructor(name, age, role) {
    this.name = name;
    this.age = age;

    this[metadataSymbol] = {
      created: new Date(),
      role,
    };
  }

  get metadatas() {
    return this[metadataSymbol];
  }
}

const junho = new Person("Junho", 27, ["user"]);
console.log(junho.metadatas);
