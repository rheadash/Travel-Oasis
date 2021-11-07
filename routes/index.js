var express = require('express')
var router = express.Router()
const path = require('path')
const mkdirp = require('mkdirp')
const oracledb = require('oracledb')

// Connect to Oracle DB
let connection
oracledb.getConnection(
	{ user: 'system', password: 'oracle', connectionString: 'localhost/xe' },
	(error, dbConnection) => {
		if (error) {
			console.error('Error connecting to Oracle DB:', error)
		} else {
			connection = dbConnection
			console.log('Successfully connected to Oracle Database')
		}
	}
)

router.get('/', (req, res, next) => {
	return res.render('login.ejs')
})

router.post('/', async (req, res, next) => {
	const sql = `INSERT INTO USERS (USERID, NAME, EMAIL, PSWD) values(:1, :2, :3, :4)`
	// Use current timestamp as user ID
	const row = [Date.now(), req.body.name, req.body.email, 'pass123']
	await connection.execute(sql, row)

	connection.commit()
	console.log('Inserted user:', req.body.name)

	return res.status(200).send('Successfully created new user')
})

router.get('/login', (req, res, next) => {
	return res.render('login.ejs')
})

router.get('/logout', function (req, res, next) {
	// remove the req.user property and clear the login session

	if (!req.session) {
		req.session.destroy(function (err) {
			res.redirect('/login')
		})
	} else {
		req.session.destroy(function (err) {
			res.redirect('/login')
		})
	}
})

router.get('/friendactivity/:userId', async(req, res, next) => {
	const userId = req.params.userId
	const userResult = await connection.execute(
		`SELECT NAME, EMAIL FROM USERS WHERE USERID = :userId`,
		[userId]
	)
	console.log('Result:', userResult)

	const row = userResult.rows[0]

	const friendsResult = await connection.execute(
		`SELECT * FROM FRIENDS
		WHERE FRIENDS.USERID = :userId`,
		[userId]

	)

	const friends = friendsResult.rows

	//console.log('Friends ', friends)
	//console.log('Friends ', friends[0][1])
	friends_ = []
	for (let i = 0; i < friends.length; i++) {
		
		friends_[i] = friends[i][1]
		console.log(friends_[i])
		
	}

	FID_ONE = friends_[Math.floor(Math.random() * friends_.length)]
	console.log("FID1: " + FID_ONE)

	const reviewsResult_one = await connection.execute(
		`SELECT PLACE.NAME, REVIEW.TEXT, PLACE.PLACEID, REVIEW.AUTHOR
		FROM REVIEW, PLACE 
		WHERE REVIEW.AUTHOR = :id
			AND REVIEW.PLACEID LIKE PLACE.PLACEID`,
		[FID_ONE]
	)

	const reviews_one = reviewsResult_one.rows

	console.log('Reviews One: ', reviews_one)

	FID_TWO = friends_[Math.floor(Math.random() * friends_.length)]
	if(FID_TWO == FID_ONE) {
		if(friends_.length > 2) {
			while(FID_TWO == FID_ONE) {
				FID_TWO = friends_[Math.floor(Math.random() * friends_.length)]
			}
		}

	}
	console.log("FID2: " + FID_TWO)

	const friend_one_result = await connection.execute(
		`SELECT USERS.NAME
		FROM USERS
		WHERE USERS.USERID = :id`,
		[FID_ONE]
	)

	const friend_one = friend_one_result.rows
	console.log(friend_one)

	const friend_two_result = await connection.execute(
		`SELECT USERS.NAME
		FROM USERS
		WHERE USERS.USERID = :id`,
		[FID_TWO]
	)

	const friend_two = friend_two_result.rows
	console.log(friend_two)

	const reactionsResult = await connection.execute(
		`SELECT * FROM
			(SELECT PHOTO.PHOTOID AS PI
			FROM PHOTO
			WHERE PHOTO.AUTHOR = :id
			) P_T 
			FULL JOIN
			(SELECT REACTION.PHOTOID AS RI,
			SUM (CASE WHEN REACTION.TYPE LIKE 'like' THEN 1 ELSE 0 END) AS likes,
			SUM (CASE WHEN REACTION.TYPE LIKE 'love' THEN 1 ELSE 0 END) AS loves,
			SUM (CASE WHEN REACTION.TYPE LIKE 'laugh' THEN 1 ELSE 0 END) AS laughs,
			SUM (CASE WHEN REACTION.TYPE LIKE 'dislike' THEN 1 ELSE 0 END) AS dislikes,
			SUM (CASE WHEN REACTION.TYPE LIKE 'angry' THEN 1 ELSE 0 END) AS angries
			FROM REACTION
			GROUP BY REACTION.PHOTOID) R_T
			ON P_T.PI LIKE R_T.RI`,
		[FID_TWO]
	)

	const reactions = reactionsResult.rows

	console.log('Reactions ', reactions)

	const photoResult = await connection.execute(
		`SELECT PHOTO.PHOTOID AS PI, PLACE.NAME, PHOTO.FILENAME, PHOTO.DATE_TAKEN, PLACE.PLACEID
		FROM PHOTO, PLACE
		WHERE PHOTO.AUTHOR = :id
		AND PHOTO.PLACEID LIKE PLACE.PLACEID`,
		[FID_TWO]
	)

	const photos = photoResult.rows

	console.log('Photos:', photos)

	return res.render('friendactivity.ejs', {
        reviews_one: reviews_one,
		friend_one: friend_one,
		friend_two: friend_two,
		reactions: reactions,
		photos: photos,
		reactions: reactions,
		userId: userId,

    })

	

})

router.post('/addfriend/:currUserID', async(req, res, next) =>{
	console.log(req.body)
	const result = await connection.execute(
		'SELECT USERID, EMAIL FROM USERS WHERE EMAIL = :email',
		{
			email: req.body.email,
		}
	)
	console.log("Email: " + result)
	const row = result.rows[0]

	if (!row) {
		//res.send({ Success: 'This user is not registered!' })
	} else if (row[1] == req.body.email) {
		req.session.userId = row[0]
		//console.log(req.session.userId)
		//console.log(row[0] + " " + row[1])
		//res.send({ Success: req.session.userId })
		//res.redirect('/friendactivity')
	} else {
		//res.send({ Success: 'Wrong e-mail!' })
		//return res.status(200).redirect('/allplaces')
	}
	
	const userId = req.params.currUserID
	//console.log(userId + " UID") 
	const friendId = req.session.userId
	//console.log(friendId + " FID")
	console.log('Adding to friend list:', "UID: " + userId, "FID: " + friendId)

	if (!userId) {
	 	console.log('Error: User not logged in')
	 	//return res.status(400).send('Error: User not logged in')
	}

	const sql = `INSERT INTO FRIENDS (USERID, FID) values(:1, :2)`
	const row_ = [userId, friendId]
	connection.execute(sql, row_, (error, result) => {
	 	if (error) {
	 		console.log('Error inserting to friend-list:', error)
	 		return res
	 			.status(400)
	 			//.send('Error: This friend is already in your friend-list')
	 	}

	 	connection.commit()
	 	console.log('Inserted to friend-list:', userId, friendId)
	// 	return res.status(200).send('Successfully added to friend-list')
		
	 })
	 res.redirect('/friendactivity/' + userId)

	console.log('End post /addfriend')
	
})

router.post('/login', async (req, res, next) => {
	console.log(req.body)
	const result = await connection.execute(
		`SELECT USERID, PSWD FROM USERS WHERE EMAIL = :email`,
		{
			email: req.body.email,
		}
	)
	console.log('Result: ', result)

	const row = result.rows[0]

	if (!row) {
		res.send({ Success: 'This email is not registered!' })
	} else if (row[1] == req.body.password) {
		req.session.userId = row[0]
		console.log(req.session.userId)
		res.send({ Success: req.session.userId })
	} else {
		res.send({ Success: 'Wrong password!' })
		//return res.status(200).redirect('/allplaces')
	}
	console.log('End post /login')
})

router.get('/registration', (req, res, next) => {
	return res.render('registration.ejs')
})

router.get("/addfriend/:userId", (req, res, next) =>{
	currUserID = req.params.userId
	return res.render('addfriend.ejs')
})

// router.get("/addfriend/:currUserID", (req, res, next) =>{
// 	return res.redirect('/profile/:currUserID')
// })

router.post('/registration', async (req, res, next) => {
	console.log(req.body)
	var userInfo = req.body

	if (
		!userInfo.email ||
		!userInfo.name ||
		!userInfo.password ||
		!userInfo.passwordConf ||
		!userInfo.a1street ||
		!userInfo.a1city ||
		!userInfo.a1state ||
		!userInfo.a1country
	) {
		res.send()
	} else {
		const preexisting = await connection.execute(
			`SELECT USERID, PSWD FROM USERS WHERE EMAIL = :email`,
			{
				email: req.body.email,
			}
		)

		const row = preexisting.rows[0]

		if (row) {
			//window.confirm('Email is already used.')
			res.send({ Success: 'Email is already used.' })
		} else {
			if (userInfo.password == userInfo.passwordConf) {
				const userSql = `INSERT INTO USERS (USERID, EMAIL, NAME, PSWD) values(:1, :2, :3, :4)`
				const userid = Date.now()
				const row = [
					userid,
					userInfo.email,
					userInfo.name,
					userInfo.password,
				]
				await connection.execute(userSql, row)

				connection.commit()
				console.log('Inserted user: ', userInfo)

				const a1Sql = `INSERT INTO ADDRESS (USERID, STREET, CITY, STATE, COUNTRY, ZIP) VAlUES(:1, :2, :3, :4, :5, :6)`
				const a1row = [
					userid,
					userInfo.a1street,
					userInfo.a1city,
					userInfo.a1state,
					userInfo.a1country,
					!userInfo.a1zip ? null : userInfo.a1zip,
				]

				await connection.execute(a1Sql, a1row)

				connection.commit()
				console.log('Inserted address: ', a1row)

				if (
					userInfo.a2street &&
					userInfo.a2city &&
					userInfo.a2state &&
					userInfo.a2country
				) {
					const a2Sql = `INSERT INTO ADDRESS (USERID, STREET, CITY, STATE, COUNTRY, ZIP) VAlUES(:1, :2, :3, :4, :5, :6)`
					const a2row = [
						userid,
						userInfo.a2street,
						userInfo.a2city,
						userInfo.a2state,
						userInfo.a2country,
						!userInfo.a2zip ? null : userInfo.a2zip,
					]

					console.log('address 2: ', a2row)

					await connection.execute(a2Sql, a2row)

					connection.commit()
					console.log('Inserted address 2: ', a2row)
				}

				if (
					userInfo.a3street &&
					userInfo.a3city &&
					userInfo.a3state &&
					userInfo.a3country
				) {
					const a3Sql = `INSERT INTO ADDRESS (USERID, STREET, CITY, STATE, COUNTRY, ZIP) VAlUES(:1, :2, :3, :4, :5, :6)`
					const a3row = [
						userid,
						userInfo.a3street,
						userInfo.a3city,
						userInfo.a3state,
						userInfo.a3country,
						!userInfo.a3zip ? null : userInfo.a3zip,
					]

					await connection.execute(a3Sql, a3row)

					connection.commit()
					console.log('Inserted address 3: ', a3row)
				}

				return res.status(200).send('Successfully created new user')
			} else {
				//window.confirm('password is not matched')
				res.send({ Success: 'password is not matched' })
			}
		}
	}
})

router.get('/allplaces', async (req, res, next) => {
	const result = await connection.execute(
		`SELECT PLACEID, NAME 
		FROM PLACE`,
		[]
	)
	const places = result.rows
	console.log('Places ', places)

	return res.render('allplaces.ejs', { places: places })
})

router.get('/profile/:id', async (req, res, next) => {
	const userId = req.params.id
	const userResult = await connection.execute(
		`SELECT NAME, EMAIL FROM USERS WHERE USERID = :id`,
		[userId]
	)
	console.log('Result:', userResult)

	const row = userResult.rows[0]

	const addressResult = await connection.execute(
		`SELECT * FROM ADDRESS
		WHERE ADDRESS.USERID = :ID`,
		[userId]
	)

	const addresses = addressResult.rows

	console.log('Addresses ', addresses)

	const photoResult = await connection.execute(
		`SELECT PHOTO.PHOTOID AS PI, PLACE.NAME, PHOTO.FILENAME, PHOTO.DATE_TAKEN, PLACE.PLACEID
		FROM PHOTO, PLACE
		WHERE PHOTO.AUTHOR = :id
		AND PHOTO.PLACEID LIKE PLACE.PLACEID`,
		[userId]
	)

	const photos = photoResult.rows

	console.log('Photos:', photos)

	//var reactions = []
	//var comments = []

	const reactionsResult = await connection.execute(
		`SELECT * FROM
			(SELECT PHOTO.PHOTOID AS PI
			FROM PHOTO
			WHERE PHOTO.AUTHOR = :id
			) P_T 
			FULL JOIN
			(SELECT REACTION.PHOTOID AS RI,
			SUM (CASE WHEN REACTION.TYPE LIKE 'like' THEN 1 ELSE 0 END) AS likes,
			SUM (CASE WHEN REACTION.TYPE LIKE 'love' THEN 1 ELSE 0 END) AS loves,
			SUM (CASE WHEN REACTION.TYPE LIKE 'laugh' THEN 1 ELSE 0 END) AS laughs,
			SUM (CASE WHEN REACTION.TYPE LIKE 'dislike' THEN 1 ELSE 0 END) AS dislikes,
			SUM (CASE WHEN REACTION.TYPE LIKE 'angry' THEN 1 ELSE 0 END) AS angries
			FROM REACTION
			GROUP BY REACTION.PHOTOID) R_T
			ON P_T.PI LIKE R_T.RI`,
		[userId]
	)

	const reactions = reactionsResult.rows

	console.log('Reactions ', reactions)

	const commentsResult = await connection.execute(
		`SELECT * FROM
			(SELECT PHOTO.PHOTOID AS PI
			FROM PHOTO
			WHERE PHOTO.AUTHOR = :id
			) P_T 
			FULL JOIN
			(SELECT COMMENTS.PHOTOID AS CI, COMMENTS.TEXT, USERS.NAME, USERS.USERID
			FROM COMMENTS, USERS
			WHERE COMMENTS.AUTHOR LIKE USERS.USERID) C_T
			ON P_T.PI LIKE C_T.CI`,
		[userId]
	)

	const temp = commentsResult.rows
	const comments = []
	for (i = 0; i < photos.length; i++) {
		comments[i] = []
		for (j = 0; j < temp.length; j++) {
			if (temp[j][0] == photos[i][0]) {
				comments[i] = comments[i].concat([temp[j]])
			}
		}
	}

	console.log('Comments ', comments)

	const reviewsResult = await connection.execute(
		`SELECT PLACE.NAME, REVIEW.TEXT, PLACE.PLACEID 
		FROM REVIEW, PLACE 
		WHERE REVIEW.AUTHOR = :id
			AND REVIEW.PLACEID LIKE PLACE.PLACEID`,
		[userId]
	)

	const reviews = reviewsResult.rows

	console.log('Reviews', reviews)

	const wishResult = await connection.execute(
		`SELECT PLACE.NAME, PLACE.PLACEID 
		FROM WISHLIST, PLACE 
		WHERE WISHLIST.USERID = :id
			AND WISHLIST.PLACEID LIKE PLACE.PLACEID`,
		[userId]
	)

	const wishlist = wishResult.rows

	console.log('Wishlist', wishlist)

	const travelResult = await connection.execute(
		`SELECT PLACE.NAME, VISIT.STARTDATE, VISIT.ENDDATE, PLACE.PLACEID 
		FROM VISIT, PLACE 
		WHERE VISIT.USERID = :id
			AND VISIT.PLACEID LIKE PLACE.PLACEID`,
		[userId]
	)

	const travelHistory = travelResult.rows

	console.log('Travel history', travelHistory)

	return res.render('profile.ejs', {
		name: row[0],
		email: row[1],
		addresses: addresses,
		reviews: reviews,
		wishlist: wishlist,
		travelHistory: travelHistory,
		photos: photos,
		reactions: reactions,
		comments: comments,
		userId: userId,
	})
})

router.get('/place/:id', async (req, res, next) => {
	const placeId = req.params.id
	const result = await connection.execute(
		`SELECT PLACE.NAME
		FROM PLACE
		WHERE PLACE.PLACEID LIKE :id`,
		[placeId]
	)

	const name = result.rows[0]

	console.log('Place name ', name)

	const photoResult = await connection.execute(
		`SELECT PHOTO.PHOTOID AS PI, PLACE.NAME, PHOTO.FILENAME, PHOTO.DATE_TAKEN, USERS.NAME, USERS.USERID
		FROM PHOTO, PLACE, USERS
		WHERE PHOTO.PLACEID = :id
		AND PHOTO.PLACEID LIKE PLACE.PLACEID
		AND USERS.USERID LIKE PHOTO.AUTHOR`,
		[placeId]
	)

	const photos = photoResult.rows

	console.log('Photos:', photos)

	const reactionsResult = await connection.execute(
		`SELECT * FROM
			(SELECT PHOTO.PHOTOID AS PI
			FROM PHOTO
			WHERE PHOTO.PLACEID = :id
			) P_T 
			FULL JOIN
			(SELECT REACTION.PHOTOID AS RI,
			SUM (CASE WHEN REACTION.TYPE LIKE 'like' THEN 1 ELSE 0 END) AS likes,
			SUM (CASE WHEN REACTION.TYPE LIKE 'love' THEN 1 ELSE 0 END) AS loves,
			SUM (CASE WHEN REACTION.TYPE LIKE 'laugh' THEN 1 ELSE 0 END) AS laughs,
			SUM (CASE WHEN REACTION.TYPE LIKE 'dislike' THEN 1 ELSE 0 END) AS dislikes,
			SUM (CASE WHEN REACTION.TYPE LIKE 'angry' THEN 1 ELSE 0 END) AS angries
			FROM REACTION
			GROUP BY REACTION.PHOTOID) R_T
			ON P_T.PI LIKE R_T.RI`,
		[placeId]
	)

	const reactions = reactionsResult.rows

	console.log('Reactions ', reactions)

	const commentsResult = await connection.execute(
		`SELECT * FROM
			(SELECT PHOTO.PHOTOID AS PI
			FROM PHOTO
			WHERE PHOTO.PLACEID = :id
			) P_T 
			FULL JOIN
			(SELECT COMMENTS.PHOTOID AS CI, COMMENTS.TEXT, USERS.NAME, USERS.USERID
			FROM COMMENTS, USERS
			WHERE COMMENTS.AUTHOR LIKE USERS.USERID) C_T
			ON P_T.PI LIKE C_T.CI`,
		[placeId]
	)

	const temp = commentsResult.rows
	const comments = []
	for (i = 0; i < photos.length; i++) {
		comments[i] = []
		for (j = 0; j < temp.length; j++) {
			if (temp[j][0] == photos[i][0]) {
				comments[i] = comments[i].concat([temp[j]])
			}
		}
	}

	console.log('Comments ', comments)

	const reviewsResult = await connection.execute(
		`SELECT PLACE.NAME, REVIEW.TEXT, USERS.NAME, USERS.USERID
		FROM REVIEW, PLACE, USERS
		WHERE REVIEW.PLACEID = :id
			AND REVIEW.PLACEID LIKE PLACE.PLACEID
			AND REVIEW.AUTHOR LIKE USERS.USERID`,
		[placeId]
	)

	const reviews = reviewsResult.rows

	console.log('Reviews', reviews)

	const transpoResult = await connection.execute(
		`SELECT TRANSPO_INFO.TYPE 
		FROM TRANSPO_INFO
		WHERE TRANSPO_INFO.PLACEID LIKE :id`,
		[placeId]
	)

	const transpo = transpoResult.rows

	console.log('Transporation ', transpo)

	const wishResult = await connection.execute(
		`SELECT USERS.NAME, USERS.USERID 
		FROM WISHLIST, USERS 
		WHERE WISHLIST.USERID = USERS.USERID
			AND WISHLIST.PLACEID LIKE :id`,
		[placeId]
	)

	const wishlist = wishResult.rows

	console.log('Wishlist', wishlist)

	const travelResult = await connection.execute(
		`SELECT USERS.NAME, VISIT.STARTDATE, VISIT.ENDDATE, USERS.USERID 
		FROM VISIT, USERS 
		WHERE VISIT.PLACEID = :id
			AND VISIT.USERID LIKE USERS.USERID`,
		[placeId]
	)

	const travelHistory = travelResult.rows

	console.log('Travel history', travelHistory)

	return res.render('place.ejs', {
		name: name,
		photos: photos,
		reactions: reactions,
		comments: comments,
		reviews: reviews,
		transpo: transpo,
		wishlist: wishlist,
		travelHistory: travelHistory,
		placeId: placeId,
	})
})

router.post('/transpo/:placeId', async (req, res, next) => {
	const placeId = req.params.placeId
	console.log('Transpo to be inserted:', req.body.transpo)
	const sql = `INSERT INTO TRANSPO_INFO (PLACEID, TYPE) values(:1, :2)`
	// Use current timestamp as user ID
	const row = [placeId, req.body.transpo]
	await connection.execute(sql, row)

	connection.commit()
	console.log('Inserted transpo:', req.body.transpo)

	return res.status(200).send('Successfully created new transpo')
})

router.post('/wishlist/:placeId', async (req, res, next) => {
	const userId = req.session.userId
	const placeId = req.params.placeId
	console.log('Adding to wishlist:', userId, placeId)
	if (!userId) {
		console.log('Error: User not logged in')
		return res.status(400).send('Error: User not logged in')
	}

	const sql = `INSERT INTO WISHLIST (USERID, PLACEID) values(:1, :2)`
	const row = [userId, placeId]
	connection.execute(sql, row, (error, result) => {
		if (error) {
			console.log('Error inserting to wishlist:', error)
			return res
				.status(400)
				.send('Error: This place is already on your wishlist')
		}

		connection.commit()
		console.log('Inserted to wishlist:', userId, placeId)
		return res.status(200).send('Successfully added to wishlist')
	})
})

router.post('/reaction/:photoId', async (req, res, next) => {
	const reaction = req.body.reaction
	const userId = req.session.userId
	const photoId = req.params.photoId
	console.log('Adding reaction:', reaction)
	if (!userId) {
		console.log('Error: User not logged in')
		return res.status(400).send('Error: User not logged in')
	}

	const sql = `INSERT INTO REACTION (REACTIONID, TYPE, AUTHOR, PHOTOID) values(:1, :2, :3, :4)`
	const row = [Date.now(), reaction, userId, photoId]

	connection.execute(sql, row, (error, result) => {
		if (error) {
			console.log('Error adding reaction:', error)
			return res
				.status(400)
				.send('Error: You have already reacted to this photo')
		}

		connection.commit()
		console.log('Added reaction:', reaction)
		return res.status(200).redirect('back')
	})
})

router.post('/comment/:photoId', async (req, res, next) => {
	const userId = req.session.userId
	const photoId = req.params.photoId
	console.log('Inserting comment:', req.body.comment)
	if (!userId) {
		console.log('Error: User not logged in')
		return res.status(400).send('Error: User not logged in')
	}

	const sql = `INSERT INTO COMMENTS (COMMENTID, TEXT, AUTHOR, PHOTOID) 
					values(:1, :2, :3, :4)`

	const row = [Date.now(), req.body.comment, userId, photoId]
	await connection.execute(sql, row)

	connection.commit()
	console.log('Inserted comment.')

	return res.status(200).redirect('back')
})

router.post('/review/:placeId', async (req, res, next) => {
	const userId = req.session.userId
	const placeId = req.params.placeId

	console.log('Review to be inserted:', req.body.review)
	const sql = `INSERT INTO REVIEW (REVIEWID, TEXT, AUTHOR, PLACEID) 
					values(:1, :2, :3, :4)`
	// Use current timestamp as user ID
	const row = [Date.now(), req.body.review, userId, placeId]
	await connection.execute(sql, row)

	connection.commit()
	console.log('Inserted review:', req.body.review)

	return res.status(200).send('Successfully created new review')
})

router.post('/visit/:placeId', async (req, res, next) => {
	const userId = req.session.userId
	const placeId = req.params.placeId
	console.log('Visit to be inserted:', req.body.start + ' ' + req.body.end)
	const sql = `INSERT INTO VISIT (USERID, PLACEID, STARTDATE, ENDDATE) 
				VALUES(:1, :2, :3, :4)`
	// Use current timestamp as user ID
	const row = [userId, placeId, req.body.start, req.body.end]
	await connection.execute(sql, row)

	connection.commit()
	console.log('Inserted visit:', req.body.start + ' ' + req.body.endo)

	return res.status(200).send('Successfully created new visit')
})

module.exports = router
