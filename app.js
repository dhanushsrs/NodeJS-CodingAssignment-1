const express = require('express')
const {open} = require('sqlite')
const path = require('path')
const sqlite3 = require('sqlite3')
const format = require('date-fns/format')
const isMatch = require('date-fns/isMatch')
const isValid = require('date-fns/isValid')

const app = express()
app.use(express.json())

let db = null

const dbPath = path.join(__dirname, 'todoApplication.db')
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Started')
    })
  } catch (e) {
    console.log(`DB ERROR: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

// API 1 GET METHOD;

const hasPriorityAndStatus = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriority = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatus = requestQuery => {
  return requestQuery.status !== undefined
}

const hasCategoryAndStatus = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  )
}

const hasCategoryAndPriority = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  )
}

const hasCategory = requestQuery => {
  return requestQuery.category !== undefined
}

const hasSearch = requestQuery => {
  return requestQuery.search_q !== undefined
}

const convertObjectToResponseObject = dbObject => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  }
}
app.get('/todos/', async (request, response) => {
  const requestQuery = request.query
  const {search_q = '', priority, status, category} = requestQuery

  let todoQuery = null
  let getTodoQuery = ''

  switch (true) {
    case hasPriorityAndStatus(requestQuery):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodoQuery = `
          SELECT *
          FROM todo
          WHERE
          priority = '${priority}' AND  
          status = '${status}';`

          todoQuery = await db.all(getTodoQuery)
          response.send(
            todoQuery.map(eachTodo => {
              return convertObjectToResponseObject(eachTodo)
            }),
          )
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }

      break

    case hasCategoryAndStatus(requestQuery):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodoQuery = `
          SELECT *
          FROM todo
          WHERE
          category LIKE '%${category}%' AND  
          status LIKE '%${status}%';`
          todoQuery = await db.all(getTodoQuery)
          response.send(
            todoQuery.map(eachTodo => {
              return convertObjectToResponseObject(eachTodo)
            }),
          )
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }

      break
    case hasCategoryAndPriority(requestQuery):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (
          priority === 'HIGH' ||
          priority === 'MEDIUM' ||
          priority === 'LOW'
        ) {
          getTodoQuery = `
            SELECT *
            FROM todo
            WHERE
            category LIKE '%${category}%' AND  
            priority LIKE '%${priority}%';`

          todoQuery = await db.all(getTodoQuery)
          response.send(
            todoQuery.map(eachTodo => {
              return convertObjectToResponseObject(eachTodo)
            }),
          )
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }

      break

    case hasCategory(requestQuery):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        getTodoQuery = `
        SELECT *
        FROM todo
        WHERE
        category LIKE '%${category}%';`

        todoQuery = await db.all(getTodoQuery)
        response.send(
          todoQuery.map(eachTodo => {
            return convertObjectToResponseObject(eachTodo)
          }),
        )
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }

      break

    case hasStatus(requestQuery):
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        getTodoQuery = `
          SELECT *
          FROM todo
          WHERE
          status LIKE '%${status}%';`

        todoQuery = await db.all(getTodoQuery)
        response.send(
          todoQuery.map(eachTodo => {
            return convertObjectToResponseObject(eachTodo)
          }),
        )
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }

      break

    case hasPriority(requestQuery):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        getTodoQuery = `
          SELECT *
          FROM todo
          WHERE
          priority LIKE '%${priority}%';`

        todoQuery = await db.all(getTodoQuery)
        response.send(
          todoQuery.map(eachTodo => {
            return convertObjectToResponseObject(eachTodo)
          }),
        )
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }

      break
    case hasSearch(requestQuery):
      getTodoQuery = `
        SELECT *
        FROM todo
        WHERE
        todo LIKE '%${search_q}%';`

      todoQuery = await db.all(getTodoQuery)
      response.send(
        todoQuery.map(eachTodo => {
          return convertObjectToResponseObject(eachTodo)
        }),
      )
      break
    default:
      getTodoQuery = `
    SELECT *
    FROM todo`

      todoQuery = await db.all(getTodoQuery)
      response.send(
        todoQuery.map(eachTodo => {
          return convertObjectToResponseObject(eachTodo)
        }),
      )
  }
})

// API 2 GET METHOD;
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodoIdQuery = `
  SELECT * 
  FROM todo
  WHERE id = ${todoId}`

  const getTodoId = await db.get(getTodoIdQuery)
  response.send(convertObjectToResponseObject(getTodoId))
})

// API 3 GET METHOD;

app.get('/agenda/', async (request, response) => {
  const {date} = request.query
  // console.log(isMatch(date, 'yyyy-MM-dd'))

  if (isMatch(date, 'yyyy-MM-dd')) {
    const newDate = format(new Date(date), 'yyyy-MM-dd')
    //console.log(newDate)

    const getTodoDueDateQuery = `
      SELECT * 
      FROM todo
      WHERE due_date = '${newDate}'`

    const getTodoDueDate = await db.all(getTodoDueDateQuery)
    // console.log(getTodoDueDate)
    response.send(
      getTodoDueDate.map(eachTodo => {
        return convertObjectToResponseObject(eachTodo)
      }),
    )
  } else {
    response.status(400)
    response.send('Invalid Due Date')
  }
})

// API 4 POST METHOD;
app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request.body

  if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
    if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (isMatch(dueDate, 'yyyy-MM-dd')) {
          const newDate = format(new Date(dueDate), 'yyyy-MM-dd')

          const postTodoQuery = `
          INSERT INTO 
          todo (id, todo, priority, status, category, due_date)
          VALUES (
            ${id},
            '${todo}',
            '${priority}',
            '${status}',
            '${category}',
            '${newDate}'
          )`

          const postTodo = await db.run(postTodoQuery)
          response.send('Todo Successfully Added')
        } else {
          response.status(400)
          response.send('Invalid Due Date')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
    }
  } else {
    response.status(400)
    response.send('Invalid Todo Priority')
  }
})

// API 5 PUT METHOD;
app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  let updateTodo

  const previousTodoQuery = `
  SELECT * 
  FROM todo 
  WHERE id = ${todoId}`

  const previousTodo = await db.get(previousTodoQuery)

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body

  const requestBody = request.body

  let updateTodoQuery
  switch (true) {
    case requestBody.status !== undefined:
      if (
        requestBody.status === 'TO DO' ||
        requestBody.status === 'IN PROGRESS' ||
        requestBody.status === 'DONE'
      ) {
        updateTodoQuery = `
      UPDATE todo
      SET 
      todo = '${todo}',
      priority = '${priority}',
      status = '${status}',
      category = '${category}',
      due_date = '${dueDate}'
      WHERE id = ${todoId}`

        updateTodo = await db.run(updateTodoQuery)
        response.send('Status Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break

    case requestBody.priority !== undefined:
      if (
        requestBody.priority === 'HIGH' ||
        requestBody.priority === 'MEDIUM' ||
        requestBody.priority === 'LOW'
      ) {
        updateTodoQuery = `
      UPDATE todo
      SET 
      todo = '${todo}',
      priority = '${priority}',
      status = '${status}',
      category = '${category}',
      due_date = '${dueDate}'
      WHERE id = ${todoId}`

        updateTodo = await db.run(updateTodoQuery)
        response.send('Priority Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }

      break

    case requestBody.category !== undefined:
      if (
        requestBody.category === 'WORK' ||
        requestBody.category === 'HOME' ||
        requestBody.category === 'LEARNING'
      ) {
        updateTodoQuery = `
      UPDATE todo
      SET 
      todo = '${todo}',
      priority = '${priority}',
      status = '${status}',
      category = '${category}',
      due_date = '${dueDate}'
      WHERE id = ${todoId}`

        updateTodo = await db.run(updateTodoQuery)
        response.send('Category Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }

      break

    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, 'yyyy-MM-dd')) {
        const newDate = format(new Date(dueDate), 'yyyy-MM-dd')

        updateTodoQuery = `
      UPDATE todo
      SET 
      todo = '${todo}',
      priority = '${priority}',
      status = '${status}',
      category = '${category}',
      due_date = '${newDate}'
      WHERE id = ${todoId}`

        updateTodo = await db.run(updateTodoQuery)
        response.send('Due Date Updated')
      } else {
        response.status(400)
        response.send('Invalid Due Date')
      }

      break

    case requestBody.todo !== undefined:
      updateTodoQuery = `
      UPDATE todo
      SET 
      todo = '${todo}',
      priority = '${priority}',
      status = '${status}',
      category = '${category}',
      due_date = '${dueDate}'
      WHERE id = ${todoId}`

      updateTodo = await db.run(updateTodoQuery)
      response.send('Todo Updated')

      break
  }
})

// API 6 DELETE METHOD;
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params

  const deleteTodoQuery = `
  DELETE FROM
  todo 
  WHERE id= ${todoId}`

  const deleteTodo = await db.run(deleteTodoQuery)
  response.send('Todo Deleted')
})

module.exports = app
