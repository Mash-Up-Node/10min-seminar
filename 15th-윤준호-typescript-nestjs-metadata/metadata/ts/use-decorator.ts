/**
 * TypeScript Decorator
 *
 * - Class Decorator
 * - Property Decorator
 * - Method Decorator
 */

function Logger(logMessage: string) {
  return function (constructor: new (...args: any[]) => any) {
    console.log(logMessage);
  };
}

function LogMethod() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const original = descriptor.value;

    descriptor.value = function (...args: any[]) {
      console.log(`Calling ${propertyKey} with args:`, args);
      const result = original.apply(this, args);
      console.log(`Result:`, result);
      return result;
    };

    return descriptor;
  };
}

function LogProperty() {
  return function (target: any, propertyKey: string) {
    let value = target[propertyKey];

    const getter = () => {
      console.log(`Getting ${propertyKey} ->`, value);
      return value;
    };

    const setter = (newValue: any) => {
      console.log(`Setting ${propertyKey} ->`, newValue);
      value = newValue;
    };

    Object.defineProperty(target, propertyKey, {
      get: getter,
      set: setter,
      enumerable: true,
      configurable: true,
    });
  };
}

@Logger("User class initialized")
class Person {
  @LogProperty()
  private name: string = "just plain text";

  @LogProperty()
  private age: number = 0;

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }

  @LogMethod()
  introduce() {
    console.log(`I'm ${this.name} and I'm ${this.age} years old`);
  }

  @LogMethod()
  saySomething(message: string): string {
    return `${this.name} says: ${message}`;
  }

  @LogMethod()
  askSomething(message: string): void {
    console.log(`${this.name} asks: ${message}`);
  }
}

const user = new Person("Junho", 27);
user.saySomething("Hello");
user.askSomething("How are you?");
user.introduce();
