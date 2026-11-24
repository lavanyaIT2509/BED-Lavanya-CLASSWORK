// GET one author
const express = require('express');
const sql = require('mssql');
const app = express();

app.use(express.json());
app.listen(3000, () => {
    console.log('Listening on port 3000');
    console.log('MY UPDATED APP IS RUNNING')
});

app.get('/authors/:id', async (req, res) => {
    const authorId = parseInt(req.params.id);

    let connection;

    try {
        connection = await sql.connect({
            server: 'localhost',
            port: 1433,
            database: 'NPBookstore',
            user: 'npbookstore_user',
            password: '0495BEDbed',
            options: { trustServerCertificate: true }
        });

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


// POST a new author
app.post('/authors', async (req, res) => {
    let connection;

    try {
        connection = await sql.connect({
            server: 'localhost',
            port: 1433,
            database: 'NPBookstore',
            user: 'npbookstore_user',
            password: '0495BEDbed',
            options: { trustServerCertificate: true }
        });

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
        connection = await sql.connect({
            server: 'localhost',
            port: 1433,
            database: 'NPBookstore',
            user: 'npbookstore_user',
            password: '0495BEDbed',
            options: { trustServerCertificate: true }
        });

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
        connection = await sql.connect({
            server: 'localhost',
            port: 1433,
            database: 'NPBookstore',
            user: 'npbookstore_user',
            password: '0495BEDbed',
            options: { trustServerCertificate: true }
        });

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

