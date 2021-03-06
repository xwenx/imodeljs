/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
import { assert, expect } from "chai";

import { Schema } from "../../src/Metadata/Schema";
import { ECObjectsError } from "../../src/Exception";
import { RelationshipClass, RelationshipConstraint } from "../../src/Metadata/RelationshipClass";
import { RelationshipEnd } from "../../src/ECObjects";
import { createSchemaJsonWithItems } from "../TestUtils/DeserializationHelpers";

function createSchemaJson(sourceConst: any, targetConst: any) {
  return createSchemaJsonWithItems({
    TestRelationship: {
      schemaItemType: "RelationshipClass",
      strength: "referencing",
      strengthDirection: "forward",
      source: {
        ...sourceConst,
      },
      target: {
        ...targetConst,
      },
    },
    SourceBaseEntity: {
      schemaItemType: "EntityClass",
    },
    TargetBaseEntity: {
      schemaItemType: "EntityClass",
    },
    TestSourceEntity: {
      schemaItemType: "EntityClass",
      baseClass: "TestSchema.SourceBaseEntity",
    },
    TestTargetEntity: {
      schemaItemType: "EntityClass",
      baseClass: "TestSchema.TargetBaseEntity",
    },
    TestCAClassA: { schemaItemType: "CustomAttributeClass", appliesTo: "Any" },
    TestCAClassB: { schemaItemType: "CustomAttributeClass", appliesTo: "Any" },
    TestCAClassC: { schemaItemType: "CustomAttributeClass", appliesTo: "Any" },
  });
}

describe("RelationshipConstraint", () => {
  describe("fromJson", () => {
    let testConstraint: RelationshipConstraint;

    beforeEach(() => {
      const schema = new Schema("TestSchema", 1, 0, 0);
      const relClass = new RelationshipClass(schema, "TestRelationship");
      testConstraint = new RelationshipConstraint(relClass, RelationshipEnd.Source);
    });
    it("should throw for invalid constraintClasses", async () => {
      const json: any = {
        polymorphic: true,
        multiplicity: "(0..1)",
        roleLabel: "test roleLabel",
      };
      const unloadedConstraintClassesJson = { ...json, constraintClasses: ["ThisClassDoesNotExist"] };
      await expect(testConstraint.deserialize(unloadedConstraintClassesJson)).to.be.rejectedWith(ECObjectsError);
    });

    const targetStubJson = {
      polymorphic: false,
      multiplicity: "(0..*)",
      roleLabel: "Test Target roleLabel",
      constraintClasses: [
        "TestSchema.TestTargetEntity",
      ],
    };

    const oneCustomAttributeJson = {
      polymorphic: true,
      multiplicity: "(0..1)",
      roleLabel: "Test Source roleLabel",
      constraintClasses: [
        "TestSchema.TestSourceEntity",
      ],
      customAttributes: [
        {
          className: "TestSchema.TestCAClassA",
          ShowClasses: true,
        },
      ],
    };
    it("async - Deserialize One Custom Attribute", async () => {
      const schema = await Schema.fromJson(createSchemaJson(oneCustomAttributeJson, targetStubJson));
      testConstraint = (await schema.getItem<RelationshipClass>("TestRelationship"))!.source;
      expect(testConstraint).to.exist;
      expect(testConstraint.customAttributes!.get("TestSchema.TestCAClassA")).to.exist;
      assert(testConstraint.customAttributes!.get("TestSchema.TestCAClassA")!.ShowClasses === true);
    });
    it("sync - Deserialize One Custom Attribute", () => {
      const schema = Schema.fromJsonSync(createSchemaJson(oneCustomAttributeJson, targetStubJson));
      testConstraint = schema.getItemSync<RelationshipClass>("TestRelationship")!.source;
      expect(testConstraint).to.exist;
      expect(testConstraint.customAttributes!.get("TestSchema.TestCAClassA")).to.exist;
      assert(testConstraint.customAttributes!.get("TestSchema.TestCAClassA")!.ShowClasses === true);
    });
    const twoCustomAttributesJson = {
      $schema: "https://dev.bentley.com/json_schemas/ec/32/draft-01/ecschema",
      name: "ValidSchema",
      polymorphic: true,
      multiplicity: "(0..1)",
      roleLabel: "Test Source roleLabel",
      constraintClasses: [
        "TestSchema.TestTargetEntity",
      ],
      customAttributes: [
        {
          className: "TestSchema.TestCAClassA",
        },
        {
          className: "TestSchema.TestCAClassB",
        },
      ],
    };
    it("async - Deserialize Two Custom Attributes", async () => {
      const schema = await Schema.fromJson(createSchemaJson(twoCustomAttributesJson, targetStubJson));
      testConstraint = (await schema.getItem<RelationshipClass>("TestRelationship"))!.source;
      expect(testConstraint).to.exist;
      expect(testConstraint!.customAttributes!.get("TestSchema.TestCAClassA")).to.exist;
      expect(testConstraint!.customAttributes!.get("TestSchema.TestCAClassB")).to.exist;
    });
    it("sync - Deserialize Two Custom Attributes", () => {
      const schema = Schema.fromJsonSync(createSchemaJson(twoCustomAttributesJson, targetStubJson));
      testConstraint = schema.getItemSync<RelationshipClass>("TestRelationship")!.source;
      expect(testConstraint).to.exist;
      expect(testConstraint.customAttributes!.get("TestSchema.TestCAClassA")).to.exist;
      expect(testConstraint.customAttributes!.get("TestSchema.TestCAClassB")).to.exist;
    });
    it("sync - Deserialize Two Custom Attributes with additional properties", () => {
      const relConstraintJson = {
        polymorphic: true,
        multiplicity: "(0..1)",
        roleLabel: "test roleLabel",
        constraintClasses: [
          "TestSchema.TestTargetEntity",
        ],
        customAttributes: [
          {
            className: "TestSchema.TestCAClassA",
            ShowClasses: false,
          },
          {
            className: "TestSchema.TestCAClassB",
            ShowClasses: true,
          },
        ],
      };
      const schema = Schema.fromJsonSync(createSchemaJson(relConstraintJson, targetStubJson));
      testConstraint = schema.getItemSync<RelationshipClass>("TestRelationship")!.source;
      expect(testConstraint).to.exist;
      assert(testConstraint.customAttributes!.get("TestSchema.TestCAClassA")!.ShowClasses === false);
      assert(testConstraint.customAttributes!.get("TestSchema.TestCAClassB")!.ShowClasses === true);
    });
  });
});
