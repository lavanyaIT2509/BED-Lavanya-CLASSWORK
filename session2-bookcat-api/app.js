// GET one author
const express = require('express');
const sql = require('mssql');
const app = express();
require('dotenv').config();
const dbConfig = require('./dbConfig');

app.use(express.json());

// GET all authors
app.get('/authors', async (req, res) => {
    let connection;

    try {
        connection = await sql.connect(dbConfig);

        const result = await connection.request().query(
            'SELECT AuthorID, Name FROM Author'
        );

        res.status(200).json(result.recordset);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });

    } finally {
        if (connection) await connection.close();
    }
});


app.get('/authors/:id', async (req, res) => {
    const authorId = parseInt(req.params.id);

    let connection;

    try {
        connection = await sql.connect(dbConfig);
        const request = connection.request();
        request.input('id', authorId);

        const result = await request.query(
            'SELECT AuthorID, Name FROM Author WHERE AuthorID = @id'
        );

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Not found' });
        }

        res.status(200).json(result.recordset[0]);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });

    } finally {
        if (connection) await connection.close();
    }
})

app.get('/categories', (req, res) => {
    res.json([
        { id: 1, name: 'Fiction' },
        { id: 2, name: 'Non-Fiction' },
        { id: 3, name: 'Biography' }
    ]);
});

// nPOST a new author
app.post('/authors', async (req, res) => {
    let connection;

    try {
        connection = await sql.connect(dbConfig);
        const request = connection.request();
        request.input('id', req.body.id);
        request.input('name', req.body.name);

        const result = await request.query(
            'INSERT INTO Author (AuthorID, Name) OUTPUT INSERTED.* VALUES (@id, @name)'
        );

        res.status(201).json(result.recordset[0]);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });

    } finally {
        if (connection) await connection.close();
    }
});



// PUT: change an author's name
app.put('/authors/:id', async (req, res) => {
    const authorId = parseInt(req.params.id);
    let connection;

    try {
        connection = await sql.connect(dbConfig);

        const request = connection.request();
        request.input('id', authorId);
        request.input('name', req.body.name);

        const result = await request.query(
            'UPDATE Author SET Name = @name OUTPUT INSERTED.* WHERE AuthorID = @id'
        );

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Not found' });
        }

        res.status(200).json(result.recordset[0]);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });

    } finally {
        if (connection) await connection.close();
    }
});



// DELETE an author
app.delete('/authors/:id', async (req, res) => {
    const authorId = parseInt(req.params.id);
    let connection;

    try {
        connection = await sql.connect(dbConfig);
        const request = connection.request();
        request.input('id', authorId);

        const result = await request.query(
            'DELETE FROM Author OUTPUT DELETED.* WHERE AuthorID = @id'
        );

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Not found' });
        }

        res.status(200).json({ message: 'Author deleted successfully' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });

    } finally {
        if (connection) await connection.close();
    }
});




// GET all books
app.get('/books', async (req, res) => {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const result = await connection.request().query(
            'SELECT ISBN, Title, YearPublish, PublisherID, BookCat FROM Book'
        );
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    } finally {
        if (connection) await connection.close();
    }
});


// GET one book by ISBN
app.get('/books/:isbn', async (req, res) => {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const request = connection.request();
        request.input('isbn', sql.Char(10), req.params.isbn);
        const result = await request.query(
            'SELECT ISBN, Title, YearPublish, PublisherID, BookCat FROM Book WHERE ISBN = @isbn'
        );
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Not found' });
        }
        res.status(200).json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    } finally {
        if (connection) await connection.close();
    }
});




// POST a new book and its author, in one transaction
app.post('/books', async (req, res) => {
    const { isbn, title, yearPublish, publisherId, bookCat, authorId } = req.body;
    let connection;
    let transaction;
    try {
        connection = await sql.connect(dbConfig);
        transaction = new sql.Transaction(connection);
        await transaction.begin();

        const bookRequest = transaction.request();
        bookRequest.input('isbn', sql.Char(10), isbn);
        bookRequest.input('title', sql.VarChar(200), title);
        bookRequest.input('yearPublish', sql.Char(4), yearPublish);
        bookRequest.input('publisherId', sql.SmallInt, publisherId);
        bookRequest.input('bookCat', sql.Char(2), bookCat);
        const bookResult = await bookRequest.query(
            'INSERT INTO Book (ISBN, Title, YearPublish, PublisherID, BookCat) ' +
            'OUTPUT INSERTED.* VALUES (@isbn, @title, @yearPublish, @publisherId, @bookCat)'
        );

        const authorRequest = transaction.request();
        authorRequest.input('isbn', sql.Char(10), isbn);
        authorRequest.input('authorId', sql.SmallInt, authorId);
        await authorRequest.query(
            'INSERT INTO BookAuthor (ISBN, AuthorID) VALUES (@isbn, @authorId)'
        );

        await transaction.commit();
        res.status(201).json(bookResult.recordset[0]);
    } catch (err) {
        console.error(err);
        if (transaction) {
            try {
                await transaction.rollback();
            } catch (rollbackErr) {
                console.error(rollbackErr);
            }
        }
        res.status(500).json({ error: 'Database error' });
    } finally {
        if (connection) await connection.close();
    }
});



app.listen(3000, () => {
    console.log('Listening on port 3000');
    console.log('MY UPDATED APP IS RUNNING')
});

// GET one copy of a book
app.get('/books/:isbn/copies/:copyNo', async (req, res) => {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const request = connection.request();
        request.input('isbn', sql.Char(10), req.params.isbn);
        request.input('copyNo', sql.TinyInt, req.params.copyNo);
        const result = await request.query(
            'SELECT ISBN, CopyNo, RentalRate, Status FROM BookCopy ' +
            'WHERE ISBN = @isbn AND CopyNo = @copyNo'
        );
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Not found' });
        }
        res.status(200).json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    } finally {
        if (connection) await connection.close();
    }
});

// PUT: change one copy's rental rate
app.put('/books/:isbn/copies/:copyNo', async (req, res) => {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const request = connection.request();
        request.input('isbn', sql.Char(10), req.params.isbn);
        request.input('copyNo', sql.TinyInt, req.params.copyNo);
        request.input('rentalRate', sql.SmallMoney, req.body.rentalRate);
        const result = await request.query(
            'UPDATE BookCopy SET RentalRate = @rentalRate OUTPUT INSERTED.* ' +
            'WHERE ISBN = @isbn AND CopyNo = @copyNo'
        );
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Not found' });
        }
        res.status(200).json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    } finally {
        if (connection) await connection.close();
    }
});

// DELETE one copy of a book
app.delete('/books/:isbn/copies/:copyNo', async (req, res) => {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const request = connection.request();
        request.input('isbn', sql.Char(10), req.params.isbn);
        request.input('copyNo', sql.TinyInt, req.params.copyNo);
        const result = await request.query(
            'DELETE FROM BookCopy WHERE ISBN = @isbn AND CopyNo = @copyNo'
        );
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Not found' });
        }
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    } finally {
        if (connection) await connection.close();
    }
});