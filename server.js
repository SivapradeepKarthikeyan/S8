const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());
const port = 3000;

const admin = require('firebase-admin');
const serviceAccount = require('./key.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

//getLocation
app.get('/location', () => {

    const collection = db.collection(adminLocation);
    const studentRef = collection.doc(studentEmail);

})


//post attendence
app.post('/attendence', async (req, res) => {
    try {
        // Get the authorization header value
        const authHeader = req.headers.authorization;
        const access_token = authHeader.split(' ')[1];
        const data = req.body;

        console.log(data)

        let studentEmail = data.email;
        let studentName = data.preferred_username;
        let studentDepartment = data.department;
        let studentYear = data.year;
        let collectionToBeAdded = studentDepartment.toUpperCase() + "-" + studentYear;

        const collection = db.collection(collectionToBeAdded);
        const studentRef = collection.doc(studentEmail);
        try {
            const studentDoc = await studentRef.get();
            if (studentDoc.exists) {

                const existingAttendanceArray = studentDoc.data().attendance || [];

                const currentDate = new Date().toJSON().slice(0, 10);
                const currentSession = (new Date().getHours()) < 12 ? 'FN' : 'AN';

                const isExistingRecord = existingAttendanceArray.find((record) => (record.date === currentDate) && (record.session === currentSession));

                if (!isExistingRecord) {

                    // Check if there's an entry for the previous date, if not, mark it as absent
                    const previousDate = new Date();
                    previousDate.setDate(previousDate.getDate() - 1);
                    const previousDateString = previousDate.toJSON().slice(0, 10);
                    const previousDateRecordIndex = existingAttendanceArray.findIndex((record) => record.date === previousDateString);

                    if (previousDateRecordIndex === -1) {
                        const previousDateRecord = {
                            date: previousDateString,
                            session: currentSession === 'FN' ? 'AN' : 'FN', // switch session
                            status: 'absent'
                        };
                        existingAttendanceArray.push(previousDateRecord);
                    }

                    var d = new Date();
                    const newAttendanceData = {
                        date: currentDate,
                        session: currentSession,
                        status: 'present',
                        time: new Date().toLocaleTimeString()
                    };

                    await studentRef.update({
                        attendance: [...existingAttendanceArray, newAttendanceData]
                    });
                    res.status(200).json({ message: 'Attendance marked successfully' });
                } else {
                    res.status(200).json({ message: 'Alredy attendence marked !' });
                }

            } else {
                console.log('No such document! create a new student');
                await studentRef.set({
                    email: studentEmail,
                    name: studentName,
                    dept: studentDepartment,
                    attendance: [
                        {
                            date: new Date().toJSON().slice(0, 10),
                            session: (new Date().getHours()) < 12 ? 'FN' : 'AN',
                            status: 'present',
                            time: new Date().toLocaleTimeString()
                        }
                    ]
                });
                res.status(201).json({ message: 'New student created and attendance marked' });
            }
        } catch (error) {
            console.error('Error getting document:', error);
        }

    } catch (error) {
        console.error('Error writing document:', error);
        res.status(500).json({ message: 'Error recording attendance' });
    }

});


//attendenceList
app.post('/attendenceList', async (req, res) => {
    console.log(req.body)
    //get the id token data
    const data = req.body;
    //Student data
    let studentEmail = data.email;
    let studentName = data.preferred_username;
    let studentDepartment = data.department;
    let studentYear = data.year;
    let collectionToBeAdded = studentDepartment.toUpperCase() + "-" + studentYear;

    //collection
    const collection = db.collection(collectionToBeAdded);
    const studentRef = collection.doc(studentEmail);

    //get student
    try {
        const studentDoc = await studentRef.get();
        if (studentDoc.exists) {
            const existingAttendanceArray = studentDoc.data().attendance || [];
            console.log("Existeing array ", existingAttendanceArray);
            res.status(200).json(existingAttendanceArray)
        } else {
            console.log('No such document!');
        }
    } catch (error) {
        console.error('Error getting document:', error);
    }


});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});



// const admin = require('firebase-admin');
// const credentials = require('./key.json');
// admin.initializeApp({
//     credential: admin.credential.cert(credentials)
// });
// const db = admin.firestore;