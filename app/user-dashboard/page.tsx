import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ArchiveIcon,
  ArrowRight,
  CogIcon,
  CreditCardIcon,
  Film,
  HeartIcon,
  PackageIcon,
  PackageOpenIcon,
  WalletIcon,
} from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

// These variables hold Tailwind CSS props for the Quick Action Cards and the ArrowIcon nested in each Card (incl. hover states)
const quickActionsCardClass =
  "group/card p-5 border border-transparent transition-all duration-200 hover:border-red-500/70 hover:bg-transparent";
const quickActionArrowClass =
  "ml-auto h-4 w-4 shrink-0 transition-transform duration-200 group-hover/card:translate-x-1 group-hover/card:text-red-400";

async function getDashboardData(userId: string) {
  const [orders, recentOrders] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      select: {
        totalAmount: true,
        items: {
          select: {
            quantity: true,
          },
        },
        status: true,
      },
    }),
    prisma.order.findMany({
      where: { userId },
      orderBy: { orderDate: "desc" },
      take: 3,
      include: {
        items: {
          include: {
            movie: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const totalOrders = orders.length;
  const spent = orders.reduce(
    (sum, order) => sum + Number(order.totalAmount),
    0,
  );
  const moviesOwned = orders.reduce(
    (sum, order) =>
      sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0,
  );

  //   const pending = orders.filter((order) => order.status === "pending").length;
  //   const paid = orders.filter((order) => order.status === "paid").length;
  //   const completed = orders.filter(
  //     (order) => order.status === "completed",
  //   ).length;
  //   const cancelled = orders.filter(
  //     (order) => order.status === "cancelled",
  //   ).length;

  // This reduce function iterates over orders and adds 1 to each status it comes across in orders.status
  // This is the basic flow in one iteration:
  // Looks at orders(which is an array of multiple orders) ->
  //      callback looks at 1 orders status ->
  //          status of order = "pending" ->
  //              statusValue[order.status] is now the same as statusValue."pending"
  //              which is the same as one of the keys in the appended object ({pending: 0, paid: ....}) ->
  //                                                              The function adds +1 to pending -> next iteration...
  const statusCounts = orders.reduce(
    (statusValue, order) => {
      statusValue[order.status] += 1;
      return statusValue;
    },
    {
      pending: 0,
      paid: 0,
      completed: 0,
      cancelled: 0,
    },
  );

  return {
    recentOrders,
    totalOrders,
    spent,
    moviesOwned,
    statusCounts,
  };
}

export default async function UserDashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const data = await getDashboardData(session.user.id);
  const firstName = session.user.name?.split(" ")[0] ?? "there";

  return (
    <main className="px-6">
      <section className="flex flex-col gap-10 mx-auto max-w-7xl px-4 py-12">
        <div className="flex flex-col gap-2">
          <h1 className="text-red-400 font-semibold">Dashboard</h1>
          <h1 className="text-2xl md:text-4xl font-semibold">
            Welcome back, {`${firstName}`}👋
          </h1>
          <div className="text-xs text-gray-300 space-y-1">
            <p className="font-semibold">
              Track your orders, library and account settings in one place
            </p>
            <p>
              Member since{" "}
              {`${session.user.createdAt.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`}{" "}
            </p>
          </div>
        </div>
        <div className="h-px bg-neutral-700/40"></div>
        {/* USER METRICS DASHBOARD */}
        <div className="flex flex-col md:grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between">
                <CardTitle className="font-extralight text-gray-300">
                  ORDER STATUS OVERVIEW
                </CardTitle>
                <PackageOpenIcon className="text-red-400" size={20} />
              </div>
            </CardHeader>
            <CardContent className="text-xl">
              <div className="grid grid-cols-2 gap-2 lg:gap-0 lg:flex lg:justify-around">
                <Badge className="bg-neutral-100/60">
                  Pending: {`${data.statusCounts.pending}`}
                </Badge>
                <Badge className="bg-amber-500/80">
                  Paid: {`${data.statusCounts.paid}`}
                </Badge>
                <Badge className="bg-green-500/80">
                  Completed: {`${data.statusCounts.completed}`}
                </Badge>
                <Badge className="bg-red-500/80">
                  Cancelled: {`${data.statusCounts.cancelled}`}
                </Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex justify-between">
                <CardTitle className="font-extralight text-gray-300">
                  TOTAL ORDERS
                </CardTitle>
                <ArchiveIcon className="text-red-400" size={20} />
              </div>
            </CardHeader>
            <CardContent className="text-2xl">{`${data.totalOrders}`}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between">
                <CardTitle className="font-extralight text-gray-300">
                  MOVIES IN LIBRARY
                </CardTitle>
                <Film className="text-red-400" size={20} />
              </div>
            </CardHeader>
            <CardContent className="text-2xl">{`${data.moviesOwned}`}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between">
                <CardTitle className="font-extralight text-gray-300">
                  LIFETIME SPENT
                </CardTitle>
                <WalletIcon className="text-red-400" size={20} />
              </div>
            </CardHeader>
            <CardContent className="text-2xl">{`${data.spent}`}</CardContent>
          </Card>
        </div>

        {/* ----------------------------- QUICK ACTIONS SECTION -------------------------*/}

        <div className="flex flex-col gap-4">
          <h2 className="text-xl">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 ">
            <Link href="/user-dashboard/order-history">
              <Card className={`${quickActionsCardClass}`}>
                <div className="flex items-center">
                  <PackageIcon
                    className="text-red-400 bg-red-900/30 rounded-lg p-3"
                    size={42}
                  />
                  <div className="min-w-0 flex-1">
                    <CardHeader>
                      <CardTitle className="font-semibold">
                        Order History
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-gray-300">
                      View past and current order details
                    </CardContent>
                  </div>
                  <ArrowRight
                    className={`${quickActionArrowClass}`}
                    size={15}
                  />
                </div>
              </Card>
            </Link>

            <Link href="/profile">
              <Card className={`${quickActionsCardClass}`}>
                <div className="flex items-center">
                  <CogIcon
                    className="text-red-400 bg-red-900/30 rounded-lg p-3"
                    size={42}
                  />
                  <div className="min-w-0 flex-1">
                    <CardHeader>
                      <CardTitle className="font-semibold">
                        Account Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-gray-300">
                      Profile, email, password
                    </CardContent>
                  </div>
                  <ArrowRight
                    className={`${quickActionArrowClass}`}
                    size={15}
                  />
                </div>
              </Card>
            </Link>

            <Link href="/user-dashboard/user-library">
              <Card className={`${quickActionsCardClass}`}>
                <div className="flex items-center">
                  <Film
                    className="text-red-400 bg-red-900/30 rounded-lg p-3"
                    size={42}
                  />
                  <div className="min-w-0 flex-1">
                    <CardHeader>
                      <CardTitle className="font-semibold">
                        My Library
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-gray-300">
                      Movies you own
                    </CardContent>
                  </div>
                  <ArrowRight
                    className={`${quickActionArrowClass}`}
                    size={15}
                  />
                </div>
              </Card>
            </Link>

            <Link href="/user-dashboard/user-favorites">
              <Card className={`${quickActionsCardClass}`}>
                <div className="flex items-center">
                  <HeartIcon
                    className="text-red-400 bg-red-900/30 rounded-lg p-3"
                    size={42}
                  />
                  <div className="min-w-0 flex-1">
                    <CardHeader>
                      <CardTitle className="font-semibold">Favorites</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-gray-300">
                      Your saved favorites
                    </CardContent>
                  </div>
                  <ArrowRight
                    className={`${quickActionArrowClass}`}
                    size={15}
                  />
                </div>
              </Card>
            </Link>

            <Link href="/user-dashboard/payment-methods">
              <Card className={`${quickActionsCardClass}`}>
                <div className="flex items-center">
                  <CreditCardIcon
                    className="text-red-400 bg-red-900/30 rounded-lg p-3"
                    size={42}
                  />
                  <div className="min-w-0 flex-1">
                    <CardHeader>
                      <CardTitle className="font-semibold">
                        Payment Methods
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-gray-300">
                      Cards & Billing
                    </CardContent>
                  </div>
                  <ArrowRight
                    className={`${quickActionArrowClass}`}
                    size={15}
                  />
                </div>
              </Card>
            </Link>
          </div>
        </div>
        <div>
          <h1>Recent Activity section to be added here aswell, 3 most recent purchases </h1>
          {/* List 3 most recent purchases here via {data.recentOrders} */}
        </div>
      </section>
    </main>
  );
}

//      User Dashboard Page
//      +------------------------------------------------------+
//      |  Header (same as landing: logo + nav)                |
//      +------------------------------------------------------+
//      |  Welcome back, [Name] 👋                             |
//      |  Quick account summary line                          |
//      +------------------------------------------------------+
//      |  [Stat cards row]                                    |
//      |  Total Orders | Movies Owned | Wishlist | Spent      |
//      +------------------------------------------------------+
//      |  [Quick Actions grid] — large clickable tiles        |
//      |  • Order History    • Account Settings               |
//      |  • My Library       • Wishlist                       |
//      |  • Payment Methods  • Browse Movies                  |
//      +------------------------------------------------------+
//      |  Recent Activity  |  Recommended For You             |
//      |  (last 3 orders)  |  (movie cards carousel)          |
//      +------------------------------------------------------+
