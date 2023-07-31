export default {
  users: {
    relations: {
      client: [
        {
          $lookup: {
            from: 'clients',
            localField: 'clientId',
            foreignField: '_id',
            as: 'client'
          }
        },
        { $unwind: '$client' },
      ],
    }
  },
}