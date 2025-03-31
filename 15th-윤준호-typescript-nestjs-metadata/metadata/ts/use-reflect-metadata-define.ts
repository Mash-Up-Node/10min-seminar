import "reflect-metadata";

// Custom Metadata Keys
const METADATA_KEY = {
  validate: "validate",
  required: "required",
};

function Required(target: any, propertyKey: string) {
  Reflect.defineMetadata(METADATA_KEY.required, true, target, propertyKey);
}

function Validate(validationFn: (value: any) => boolean) {
  return function (target: any, propertyKey: string) {
    Reflect.defineMetadata(
      METADATA_KEY.validate,
      validationFn,
      target,
      propertyKey
    );
  };
}

const validateEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

class User {
  @Required
  @Validate(validateEmail)
  email: string;

  name: string;

  constructor(email: string, name: string) {
    this.email = email;
    this.name = name;
  }
}

function validateObject<T extends Record<string, any>>(obj: T): boolean {
  const prototype = Object.getPrototypeOf(obj);
  const properties = Object.getOwnPropertyNames(obj);

  for (const property of properties) {
    const isRequired = Reflect.getMetadata(
      METADATA_KEY.required,
      prototype,
      property
    );
    if (isRequired && !obj[property]) {
      console.error(`${property} is required`);
      return false;
    }

    const validateFn = Reflect.getMetadata(
      METADATA_KEY.validate,
      prototype,
      property
    );
    if (validateFn && !validateFn(obj[property])) {
      console.error(`Property ${property}'s value is invalid`);
      return false;
    }
  }

  return true;
}

// true
const validUser = new User("hoplin.dev@gmail.com", "Junho");
console.log(validateObject(validUser));

// false
const invalidUser = new User("Seems to be invalid email", "Someone");
console.log(validateObject(invalidUser));
