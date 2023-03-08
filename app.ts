import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import mysql, { OkPacket } from 'mysql2/promise';
import { z } from 'zod';

const app = express();

// Parse request body as JSON
app.use(bodyParser.json());

// MySQL connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  database: 'projects',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Define the validation schema for the page name field
const schema = z.object({
  page_name: z.string().min(3),
});

// Add a new page to the "page" table
//-----------------------------------------------------------------------------------------
app.post('/addPage', async (req: Request, res: Response) => {
    try {
      // Validate request body using the schema
      const { page_name } = schema.parse(req.body);
  
      // Insert data into MySQL database
      const [result] = await pool.query(
        'INSERT INTO page (page_name, created_on) VALUES (?, NOW())',
        [page_name]
      );
  
      res.status(201).json({ id: (result as OkPacket).insertId, message: 'Page created successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Something went wrong' });
    }
  });
  

// Read all pages
//-----------------------------------------------------------------------------------------
app.get('/readPage', async (req: Request, res: Response) => {
    try {
      // Fetch data from MySQL database
      const [rows] = await pool.query('SELECT * FROM page');
  
      res.status(200).json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Something went wrong' });
    }
});

//single page post 
//-----------------------------------------------------------------------------------------
app.get('/readPage/:id', async (req, res) => {
    const id = req.params.id;
    try {
      const [rows] = await pool.execute('SELECT * FROM page WHERE id = ?', [id]);
      if (Array.isArray(rows) && rows.length > 0) {
        res.json(rows[0]);
      } else {
        res.status(404).send('page post not found');
      }
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Error retrieving page ');
    }
});
  
// Update a page
//-----------------------------------------------------------------------------------------
app.put('/updatePage/:id', async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const { page_name } = schema.parse(req.body);
  
      // Update page_name and updated_on columns in the page table
      const [result] = await pool.query(
        'UPDATE page SET page_name = ?, updated_on = NOW() WHERE id = ?',
        [page_name, id]
      );
  
      if ((result as any).affectedRows === 0) {
        // If no rows were affected, return a 404 status code
        res.status(404).json({ error: 'Page not found' });
      } else {
        // Otherwise, return a success message
        res.status(200).json({ message: 'Page updated successfully' });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Something went wrong' });
    }
});

  

  

// Delete a page
//-----------------------------------------------------------------------------------------
app.delete('/deletePage/:id', async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
  
      // Query the database to delete the page with the specified ID
      const [result] = await pool.query('DELETE FROM page WHERE id = ?', [id]);
  
      if ((result as any).affectedRows === 0) {
        // If no page was deleted with the specified ID, return a 404 status code
        res.status(404).json({ error: 'Page not found' });
      } else {
        // Otherwise, return a success message
        res.status(200).json({ message: 'Page deleted successfully' });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Something went wrong' });
    }
});
  

// Start the server
//-----------------------------------------------------------------------------------------
app.listen(5000, () => {
  console.log('Server started on port 5000');
});
