/**
 * Metadata 얘시3: Property Descriptor를 활용하는 경우
 */

function setMetadata(obj, metadataKey, value) {
  if (!Object.hasOwnProperty.call(obj, "metadata")) {
    Object.defineProperty(obj, "metadata", {
      value: {},
      enumerable: false,
      writable: true,
      configurable: true,
    });
  }
  obj.metadata[metadataKey] = value;
}

const person = { name: "Junho", age: 27 };
setMetadata(person, "role", ["user"]);
setMetadata(person, "created", "1999-08-15");

// [ 'name', 'age' ]
// metadata프로퍼티에 대해 Enumerable이 False이기 때문에, metadata는 열거되지 않음
console.log(Object.keys(person));

// { role: [ 'user' ], created: '1999-08-15' }
console.log(person.metadata);
