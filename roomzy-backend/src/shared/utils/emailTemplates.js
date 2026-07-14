export const templates = {
  newRoomInterest: (initiatorEmail, roomName) => `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
      <h2>New Interest in Your Listing!</h2>
      <p>Great news! <strong>${initiatorEmail}</strong> is interested in your listing: <em>${roomName}</em>.</p>
      <p>Log in to your Roomzy dashboard to review their profile and accept or decline the request.</p>
      <a href="https://yourfrontend.com/dashboard" style="display: inline-block; padding: 10px 20px; background: #000; color: #fff; text-decoration: none; border-radius: 5px;">View Request</a>
    </div>
  `,
  
  newFlatmateConnection: (initiatorEmail) => `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
      <h2>New Flatmate Connection Request!</h2>
      <p>Someone thinks you'd make a great flatmate! <strong>${initiatorEmail}</strong> wants to connect with you.</p>
      <p>Check out their lifestyle profile and see if you are a match.</p>
      <a href="https://yourfrontend.com/inbox" style="display: inline-block; padding: 10px 20px; background: #000; color: #fff; text-decoration: none; border-radius: 5px;">View Profile</a>
    </div>
  `,

  matchAccepted: (receiverEmail) => `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
      <h2>Connection Accepted!</h2>
      <p>Congratulations! <strong>${receiverEmail}</strong> has accepted your request.</p>
      <p>You can now start messaging them directly through the Roomzy platform to discuss details.</p>
      <a href="https://yourfrontend.com/messages" style="display: inline-block; padding: 10px 20px; background: #000; color: #fff; text-decoration: none; border-radius: 5px;">Start Chatting</a>
    </div>
  `
};