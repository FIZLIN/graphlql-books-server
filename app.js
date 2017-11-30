const express = require('express');
const bodyParser = require('body-parser');
// const { graphqlExpress, graphiqlExpress } = require('apollo-server-express');
const graphqlHTTP = require('express-graphql');
const { buildSchema } = require('graphql');

const authors = require('./users.json');
const books = require('./books.json');

const port = 3000;

const app = express();
app.use(bodyParser.json());

// const schema = require('./gql/schema');
const schema = buildSchema(`
  type Author {
    id: ID!
    name: String!
    email: String
    books: [Book!]
  }

  type Book {
    id: ID!
    title: String!
    author: Author
    description: String!
  }
  
  type Query {
    hello: String,
    allAuthors: [Author],
    author(name: String, email: String, id: Int): Author,
    allBooks: [Book],
    book(id: Int, title: String): Book
  }

  type Mutation {
    newHello(hello: String!): String
    newAuthor(name: String!, email: String!): Author
    newBook(title: String!, description: String!, author: Int!): Book
  }
`);

const root = {
  hello: () => {
    return 'hello';
  },
  newHello: ({ hello }) => {
    string = hello;
    return string;
  },
  allAuthors: () => {
    let result = authors.map((x) => {
      let author = JSON.parse(JSON.stringify(x));
      let crr_books = books.filter((y) => {
        return x.books.indexOf(y.id) > -1;
      }).map((y) => {
        let tmp = JSON.parse(JSON.stringify(y));
        tmp.author = author;
        return tmp;
      });
      author.books = crr_books;
      return author;
    })
    return result;
  },
  author: ({id, name, email}) => {
    return authorFunc({id, name, email});
  },
  allBooks: () => {
    let result = books.map((x) => {
      let tmp = JSON.parse(JSON.stringify(x));
      let tmpAuthor = authorFunc({ id: tmp.author });
      tmp.author = tmpAuthor
      return tmp;
    })
    return result;
  },
  book: ({id, title}) => {
    let tmpBooks = books.filter((x) => {
      return (id? x.id === id : true) &&
             (title? x.title === title : true);
    });
    if (!tmpBooks.length) return null;
    let book = JSON.parse(JSON.stringify(tmpBooks[0]));
    let tmpAuthor = authorFunc({id: book.author});
    book.author = tmpAuthor;
    return book;
  },
  newAuthor: ({name, email}) => {
    let author = {
      name,
      email,
      id: authors[(authors.length - 1)].id + 1,
      books: []
    }
    authors.push(author);

    return author;
  },
  newBook: ({title, description, author}) => {
    let tmpAuthor = authorFunc({ id: author });
    if (!tmpAuthor) return null;
    let newId = books[(books.length - 1)].id + 1; 
    let book = {
      id: newId,
      title,
      description,
      author
    };

    books.push(book);
    authors[author - 1].books.push(newId);

    let res = JSON.parse(JSON.stringify(book));
    res.author = authorFunc({ id: book.author });
    return res;
  }
}

const authorFunc = ({id, name, email}) => {
  let tmpAuthors = authors.filter((x) => {
    return (id? x.id === id : true) &&
           (name? x.name === name : true) &&
           (email? x.email === email : true);
  });
  if (!tmpAuthors.length) return null;
  let author = JSON.parse(JSON.stringify(tmpAuthors[0]));
  let crr_books = books.filter((y) => {
    return author.books.indexOf(y.id) > -1;
  }).map((y) => {
    let tmp = JSON.parse(JSON.stringify(y));
    tmp.author = author;
    return tmp;
  });

  author.books = crr_books;

  return author;
}

app.use('/graphql', graphqlHTTP({
  schema,
  rootValue: root,
  graphiql: true,
}));

app.use('/', (req, res) => {
  res.json('Go to /graphql to test your queries and mutations!');
});

app.get('/', (req, res) => {
  res.send('Hello World!');
  res.end();
})

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
});