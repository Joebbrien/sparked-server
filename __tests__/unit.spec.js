import axios from "axios";
import dotenv from "dotenv";
import mongoose from "mongoose";
import child_process from "child_process";
import { Unit, UnitSchema } from "../data/models/unit";

dotenv.config();

const token = process.env.TOKEN;
const url = process.env.URL;

// console.log();
afterAll(async () => {
  await child_process.exec(`${process.env.PWD}/cleanCollections.sh`);
});

// afterEach(() => {
//   console.log("I run after test");
// });

describe("unit resolvers", () => {
  test("should return an error when not authenticated", async () => {
    const responseData = await axios.post(url, {
      query: `
        query {
          getUnits {
            name
            _id
          }
        }
      `
    });
    const {
      data: { data, errors }
    } = responseData;

    expect(data.getUnits).toBe(null);
    expect(errors[0].message).toBe("you must be logged in");
  });

  test("should create a unit and return proper data", async () => {
    const unit = await axios.post(url, {
      query: `
          mutation {
            addUnit(name: "Fundamentals", createdBy:"olivier") {
              name
              createdAt
              createdBy
            }
          }
      `
    });
    const {
      data: {
        data: { addUnit }
      }
    } = await unit;
    expect(addUnit.name).toBe("Fundamentals");
    expect(addUnit.createdBy).toBe("olivier");
    expect(addUnit.createdAt).toBe(null);
  });
  test("should query all units", async () => {
    const response = await axios.post(
      url,
      {
        query: `
          query {
              getUnits {
                  name
              }
          }
          `
      },
      {
        headers: {
          authorization: token
        }
      }
    );
    const { data } = response;

    expect(data).toMatchObject({
      data: {
        getUnits: [
          {
            name: "Fundamentals"
          }
        ]
      }
    });
    expect(data.data).toHaveProperty("getUnits");
    expect(data.data.getUnits[0].name).toBe("Fundamentals");
  });
});
