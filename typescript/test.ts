import 'reflect-metadata';
import typia from 'typia';

function ValidateType(target: any, propertyKey: string | symbol, parameterIndex: number) {
    const existingParamTypes: any[] = Reflect.getMetadata("design:paramtypes", target, propertyKey) || [];
    existingParamTypes[parameterIndex] = Reflect.getMetadata("design:type", target, propertyKey);
    Reflect.defineMetadata(`validate:paramtypes`, existingParamTypes, target, propertyKey);
  }

  function validateParams(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
  
    descriptor.value = function (...args: any[]) {
      const paramTypes: any[] = Reflect.getMetadata("design:paramtypes", target, propertyKey) || [];
      
      paramTypes.forEach((type: any, index: number) => {
        if (type) {
          const validator = typia.createValidate<typeof type.prototype>();
          const isValid = validator(args[index]);
  
          if (!isValid) {
            throw new Error(`Invalid type for parameter ${index + 1}: Expected ${type.name}`);
          }
        }
      });
  
      return originalMethod.apply(this, args);
    };
  }

  type A = { foo: string };
type B = { bar: string };

  class Example {
    @validateParams
    public exampleMethod(
      @ValidateType param1: A,
      @ValidateType param2: B
    ): void {
      console.log('All parameters are valid:', param1, param2);
    }
  }


  // Example usage
const example = new Example();

// Valid arguments
try {
  example.exampleMethod({ foo: 'test' }, { bar: 'test' });
} catch (error) {
  console.error(error);
}

// Invalid arguments
try {
    //@ts-ignore
  example.exampleMethod({ foo: 'test' }, { bar: 123 }); // This should throw an error
} catch (error) {
  console.error(error);
}