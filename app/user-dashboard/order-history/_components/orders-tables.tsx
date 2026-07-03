import { PaidBadge, PendingBadge } from "@/components/status-badges";

import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";

async function getOrders(userId: string) {
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { orderDate: "desc" },
    select: {
      id: true,
      orderDate: true,
      status: true,
      totalAmount: true,
      items: {
        select: {
          id: true,
          quantity: true,
          unitPriceAtPurchase: true,
          movie: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
              price: true,
            },
          },
        },
      },
    },
  });

  return orders;
}

async function OrdersTable({ userId }: { userId: string }) {
  const orders = await getOrders(userId);
  const activeOrders = orders.filter(
    (order) => order.status === "pending" || order.status === "paid",
  );
  const pastOrders = orders.filter(
    (order) => order.status === "completed" || order.status === "cancelled",
  );

  return (
    <div className="flex flex-col gap-10 overflow-x-auto">
      <div>
        <h2 className="text-xl font-semibold pl-6">Active Orders</h2>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    {order.status === "pending" ? (
                      <PendingBadge value={`${order.status}`} />
                    ) : (
                      <PaidBadge value={`${order.status}`} />
                    )}
                  </TableCell>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>{order.orderDate.toLocaleDateString()}</TableCell>
                  <TableCell>
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </TableCell>
                  <TableCell>
                    {order.items.reduce(
                      (sum, item) =>
                        sum + Number(item.unitPriceAtPurchase) * item.quantity,
                      0,
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold pl-6">Past Orders</h2>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pastOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    {order.status === "pending" ? (
                      <PendingBadge value={`${order.status}`} />
                    ) : (
                      <PaidBadge value={`${order.status}`} />
                    )}
                  </TableCell>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>{order.orderDate.toLocaleDateString()}</TableCell>
                  <TableCell>
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </TableCell>
                  <TableCell>
                    {order.items.reduce(
                      (sum, item) =>
                        sum + Number(item.unitPriceAtPurchase) * item.quantity,
                      0,
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}

export { OrdersTable, getOrders };

/* 
Plan: 
Get all orders data via userId with prisma query

Create two tables using shadcn comps
  - Active Orders
    - map pending and paid orders
      - pending order data + pending badge
      - paid order data + paid badge
  - Past Orders
    - map table rows for completed and cancelled
      - completed order data + success-badge
      - cancelled order data + destructive-badge

Possibly add feature: 
- dropdown menu in the table 
    OR 
- simply create an OrderDetailsPage for individual order details

Table example
+-------------------------------------------------------------------------------------------+
|                                   ACTIVE ORDERS                                           |
+-------------------+------------+---------------------+------------------+------------------+
| Status            | Order ID   | Order Date          | Items (count)    | Total Amount     |
+-------------------+------------+---------------------+------------------+------------------+
| [ PENDING ]       | 1023       | 2026-06-28 14:32    | 3 items          | 299,00 kr        |
| [ PAID ]          | 1044       | 2026-07-01 09:12    | 1 item           | 129,00 kr        |
+-------------------+------------+---------------------+------------------+------------------+


+-------------------------------------------------------------------------------------------+
|                                   PAST ORDERS                                             |
+-------------------+------------+---------------------+------------------+------------------+
| Status            | Order ID   | Order Date          | Items (count)    | Total Amount     |
+-------------------+------------+---------------------+------------------+------------------+
| [ COMPLETED ]     | 0991       | 2026-05-14 18:22    | 2 items          | 199,00 kr        |
| [ CANCELLED ]     | 0987       | 2026-05-12 11:05    | 1 item           | 89,00 kr         |
+-------------------+------------+---------------------+------------------+------------------+
*/
