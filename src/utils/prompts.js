exports.getEvalAttentionPrompt = (allCreatorTweetsAndReplies) => {
    return `Hey I am sending you a list which has sublists and one sublist represents a creators collection of tweets he/she has made in past one hour. One item in the sublist represents a tweet and has attributes like bookmarkCount, likes, replies, retweets, views. You have to distribute a pool of 100 attention points among each creator based on the the parameters I mentioned and return a list like
                                [
                                    { 
                                        "username":<creator-uname>, 
                                        "attention": <their attention score>
                                    }
                                ].

                            ------ here is the list of sublists, Only just return the response in the format i told do not add anyother text around or before it just the respone format should be returned make sure to just retrun the response exactly as it is state no new words or letters added
                             ${JSON.stringify(allCreatorTweetsAndReplies, null, 2)}`
}


exports.getEvalUserSupportPrompt = (userReplies) => {
    return `Hey i am sending you a list in which each item is a reply from a follower/user to a creator on a social media platform. This list contains all the replies a creator has gotten in the past hour. And each reply consists of the username of the user that the reply is from. I want you to assign percentage based support to each user who has replied based on the factors that are in the reply object make sure that the sum of all the percentage based support you allot to the users should amount to 100 as it is a percentage based support. Thus return the response in this format
[
	{
		"username": <users username>
		 "percentBasedSupp": <percentage based support>
	}
]

---- here is the list of user replies, Only just return the response in the format i told do not add anyother text around or before it just the respone format should be returned make sure to just retrun the response exactly as it is state no new words or letters added. Also it is very important that you yourself figure out if there are two replies from one user then just only reutrn one object representing the user in the response, point being the response should include unique users and if multiple replies from one user then just increase its support weight
                             ${JSON.stringify(userReplies, null, 2)}`
}

