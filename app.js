const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

// Get all todos whose status is "TO DO" API
app.get("/todos/", async (request, response) => {
  const { search_q = "", priority, status } = request.query;
  let getTodosQuery = "";
  let data = null;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
        SELECT
            *
        FROM
            todo
        WHERE
            todo LIKE '%${search_q}%'
            AND priority = '${priority}'
            AND status = '${status}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
        SELECT
            *
        FROM
            todo
        WHERE
            todo LIKE '%${search_q}%'
            AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
        SELECT
            *
        FROM
            todo
        WHERE
            todo LIKE '%${search_q}%'
            AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
        SELECT
            *
        FROM
            todo
        WHERE
            todo LIKE '%${search_q}%';`;
  }
  data = await db.all(getTodosQuery);
  response.send(data);
});

// Get todo based on ID API2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodosQuery = `
        SELECT
          *
        FROM
          todo
        WHERE
          id = '${todoId}';`;
  const todoData = await db.get(getTodosQuery);
  response.send(todoData);
});

// Create a todo API 3

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const createTodo = `
    INSERT INTO
      todo (id, todo, priority, status)
    VALUES
      (${id}, '${todo}', '${priority}', '${status}');`;
  await db.run(createTodo);
  response.send("Todo Successfully Added");
});

// Update todo details API 4

const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasTodo = (requestQuery) => {
  return requestQuery.todo !== undefined;
};

app.put("/todos/:todoId/", async (request, response) => {
  //const { id, todo, priority, status } = request.body;
  const { todoId } = request.params;
  let updateTodo = "";
  let text = "";
  switch (true) {
    case hasStatus(request.body):
      text = "Status Updated";
      break;
    case hasPriority(request.body):
      text = "Priority Updated";
      break;
    case hasTodo(request.body):
      text = "Todo Updated";
      break;
  }
  const preTodoQuery = `
    SELECT
        *
    FROM
        todo
    WHERE
        id = '${todoId}';`;
  const preTodo = await db.get(preTodoQuery);

  const {
    todo = preTodo.todo,
    priority = preTodo.priority,
    status = preTodo.status,
  } = request.body;

  updateTodo = `
    UPDATE
        todo
    SET
        todo = '${todo}',
        priority = '${priority}',
        status = '${status}'
    WHERE
        id = ${todoId};`;
  await db.run(updateTodo);
  response.send(text);
});

// Delete toto API 5

app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const getTodosQuery = `
        DELETE FROM
            todo
        WHERE
            id = '${todoId}';`;
  await db.run(getTodosQuery);
  response.send("Todo Deleted");
});

module.exports = app;
