// app/components/DashboardNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserPlus, BookPlus, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/app/context/AuthContext";
import { motion } from "framer-motion";

const navigation = [
  {
    name: "Add User",
    href: "/dashboard/add-user",
    icon: UserPlus,
    description: "Create and manage user accounts",
  },
  {
    name: "Add Course",
    href: "/dashboard/create-course",
    icon: BookPlus,
    description: "Add and organize courses",
  },
  {
    name: "Update Course",
    href: "/dashboard/update-course",
    icon: BookPlus,
    description: "update and organize courses",
  },
  {
    name: "Projects",
    href: "/dashboard/projects",
    icon: BookPlus,
    description: "maintain projects",
  },
];

export function DashboardNav() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <motion.div
          initial={{ x: -64 }}
          animate={{ x: 0 }}
          className="flex min-h-0 flex-1 flex-col border-r bg-white/80 backdrop-blur-sm"
        >
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-shrink-0 items-center px-4"
            >
              <span className="text-lg font-semibold bg-gradient-to-r from-[#004aad] to-blue-500 bg-clip-text text-transparent">
                Dashboard
              </span>
            </motion.div>
            <nav className="mt-8 flex-1 space-y-2 px-2">
              {navigation.map((item, idx) => {
                const isActive = pathname === item.href;
                return (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * (idx + 1) }}
                  >
                    <Link
                      href={item.href}
                      className={cn(
                        "group relative flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 ease-in-out",
                        isActive
                          ? "bg-[#004aad] text-white shadow-md"
                          : "text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "mr-3 h-5 w-5 flex-shrink-0 transition-transform duration-300 ease-in-out group-hover:scale-110",
                          isActive
                            ? "text-white"
                            : "text-gray-400 group-hover:text-[#004aad]"
                        )}
                      />
                      <span className="flex flex-col">
                        {item.name}
                        <span
                          className={cn(
                            "text-xs font-normal transition-opacity duration-300",
                            isActive ? "text-blue-100" : "text-gray-400",
                            "opacity-0 group-hover:opacity-100"
                          )}
                        >
                          {item.description}
                        </span>
                      </span>
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute -right-2 top-1/2 h-4 w-1 -translate-y-1/2 rounded-l-full bg-white"
                        />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="px-2 pb-2"
            >
              <button
                onClick={logout}
                className="group flex w-full items-center px-4 py-3 text-sm font-medium text-gray-600 rounded-lg hover:bg-red-50 transition-all duration-300"
              >
                <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-red-500 transition-colors duration-300" />
                Logout
              </button>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Mobile Bottom Navigation */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t md:hidden"
      >
        <nav className="flex justify-around p-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="relative rounded-lg"
              >
                <motion.div
                  className={cn(
                    "flex flex-col items-center px-6 py-2 rounded-lg transition-all duration-300",
                    isActive
                      ? "bg-[#004aad] text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 mb-1 transition-all duration-300",
                      isActive ? "text-white" : "text-gray-400"
                    )}
                  />
                  <span className="text-xs font-medium">{item.name}</span>
                </motion.div>
              </Link>
            );
          })}
        </nav>
      </motion.div>
    </>
  );
}
