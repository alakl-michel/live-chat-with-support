const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const { Server } = require("socket.io")
const io = new Server(server)



app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})
app.get('/admin', (req, res) => {
    res.sendFile(__dirname + '/admin.html')
})



const Users = []
//custom namespace for admin support
io.of('/admin').on('connection',  (socket) => {

    // on admin connecet get all users
    io.of('/admin').emit('refreshUsers', Users )

    // on admin request can join a room chat
    socket.on('joinRoom', data => {
        socket.join(`room__${data}`)
    })  
    
    // admin send message add it to the users array update chats
    socket.on('message', data => {
        const userItem = Users.find( item => item.userId === data.room )
        userItem.Chats.push(data)
        io.sockets.in(`room__${data.room}`).emit('refreshChat', userItem.Chats )
        io.of('/admin').emit('refreshUsers', Users )
    })    
    
})

io.on('connection', (socket) => {
    
    // on client connect add it to the users array
    Users.push( {
        userId : socket.id,
        Chats : []
    })
    // each client get its own channel
    socket.join(`room__${socket.id}`)
    // send the admin the updated users list
    io.of('/admin').emit('refreshUsers', Users )

    // on client disconnect remove it from the users and update the admin 
    socket.on('disconnect', () => {
        Users.splice(Users.findIndex(item => item.userId === socket.id ), 1)
        io.of('/admin').emit('refreshUsers', Users )
    })

    // on client send message add it to the users array and notify the admin
    socket.on('message', data => {
        const userItem = Users.find( item => item.userId === socket.id )
        userItem.Chats.push(data)
        io.sockets.in(`room__${socket.id}`).emit('refreshChat', userItem.Chats )
        io.of('/admin').emit('refreshUsers', Users )
    })

})


/*
// mapping through the socket io map object to detected the available rooms
availableRooms = function () {
    const rooms = io.sockets.adapter.rooms
    // extract map keys and store them in arry
    const keys = Array.from( rooms.keys() )
    // filter the array and only keep the room names
    const filteredKeys = keys.filter( room => room.includes("room__") )
    return filteredKeys
}
*/


server.listen(3000, () => {
  console.log('listening on *:3000')
})