export default function OrderHistoryPage() {
  return (
    <div>
      <h1 className="text-4xl p-4">Order History Page</h1>

      <div className="px-4">
        <h2 className="font-bold text-2xl">A practical layout would be:</h2>
        <ul>
          <li>
            - one table for “Current Orders” at the top, filtered to active
            statuses
          </li>
          <li>- one table OR collapsed section for “Past Purchases”</li>
          <li>- optional filters by status and date</li>
        </ul>
      </div>
    </div>
  );
}
