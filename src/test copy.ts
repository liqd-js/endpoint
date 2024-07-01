import 'reflect-metadata';

type x = { [key: string]: any };

function LogParamTypes(target: any, propertyKey: string | symbol) {
    const paramTypes = Reflect.getMetadata('design:paramtypes', target, propertyKey);
    console.log(`Parameter types for ${String(propertyKey)}:`, paramTypes);
  }

class Example {
  @LogParamTypes
  myMethod(a: string, b: number | null, c: x ) {
    return Math.random();
  }
}

// Trigger metadata logging by creating an instance and calling the method
const example = new Example();
const example2 = new Example();
example.myMethod('test', 42, { a: 1, b: 2 });
example.myMethod('test', 42, { a: 1, b: 2 });
example.myMethod('test', 42, { a: 1, b: 2 });