
export const creatorLookUp: Object = {
  $lookup: {
    from: 'users',
    let: { id: '$creator' },
    pipeline: [
      {
        $match: { $expr: { $eq: ['$_id', '$$id'] } }
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          _id: 1
        }
      }
    ],
    as: 'creator'
  }
};
