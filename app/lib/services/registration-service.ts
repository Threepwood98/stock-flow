import { prisma } from "../prisma";
import type {
  CompleteRegistrationData,
  SalesAreaInput,
  StoreInput,
  WarehouseInput,
} from "../types/complete-profile";

export class RegistrationService {
  /**
   * Buscar o crear una tienda
   */
  static async findOrCreateStore(storeData: StoreInput) {
    let store = await prisma.store.findUnique({
      where: { name: storeData.name },
      include: { warehouses: true, salesAreas: true },
    });

    if (store) return store;

    store = await prisma.store.create({
      data: {
        name: storeData.name,
        warehouses: {
          create: storeData.warehouses.map((wh) => ({ name: wh.name })),
        },
        salesAreas: {
          create: storeData.salesAreas.map((sa) => ({ name: sa.name })),
        },
      },
      include: { warehouses: true, salesAreas: true },
    });

    return store;
  }

  /**
   * Sincronizar almacenes de una tienda
   */
  static async syncWarehouses(storeId: string, warehouses: WarehouseInput[]) {
    const results = [];

    for (const wh of warehouses) {
      const existing = await prisma.warehouse.findUnique({
        where: { name_storeId: { name: wh.name, storeId } },
      });

      if (existing) {
        const updated = await prisma.warehouse.update({
          where: { id: existing.id },
          data: { name: wh.name },
        });
        results.push(updated);
      } else {
        const created = await prisma.warehouse.create({
          data: { name: wh.name, storeId },
        });
        results.push(created);
      }
    }

    return results;
  }

  /**
   * Sincronizar áreas de venta de una tienda
   */
  static async syncSalesAreas(storeId: string, salesAreas: SalesAreaInput[]) {
    const results = [];

    for (const sa of salesAreas) {
      const existing = await prisma.salesArea.findUnique({
        where: { name_storeId: { name: sa.name, storeId } },
      });

      if (existing) {
        const updated = await prisma.salesArea.update({
          where: { id: existing.id },
          data: { name: sa.name },
        });
        results.push(updated);
      } else {
        const created = await prisma.salesArea.create({
          data: { name: sa.name, storeId },
        });
        results.push(created);
      }
    }

    return results;
  }

  /**
   * Completar el perfil del usuario con toda la información
   * VERSIÓN OPTIMIZADA - Usa el constraint único
   */
  static async completeUserProfile(
    userId: string,
    data: CompleteRegistrationData
  ) {
    return await prisma.$transaction(async (tx) => {
      // 1. Actualizar datos básicos del usuario
      const user = await tx.user.update({
        where: { id: userId },
        data: { profileCompleted: true },
      });

      // 2. Gestionar teléfonos del usuario
      await tx.phone.deleteMany({ where: { userId } });

      const phones = await Promise.all(
        data.phones.map((phone) =>
          tx.phone.create({
            data: {
              number: phone.number,
              isPrimary: phone.isPrimary,
              userId,
            },
          })
        )
      );

      // 3. Procesar cada tienda
      const storeResults = [];

      for (const storeData of data.stores) {
        // Buscar o crear la tienda
        let store = await tx.store.findUnique({
          where: { name: storeData.name },
        });

        if (!store) {
          store = await tx.store.create({
            data: { name: storeData.name },
          });
        }

        // Intentar crear la relación usuario-tienda
        // Si ya existe, upsert lo manejará automáticamente
        await tx.userStore.upsert({
          where: {
            userId_storeId: {
              userId: userId,
              storeId: store.id,
            },
          },
          update: {},
          create: {
            userId,
            storeId: store.id,
          },
        });

        // Sincronizar almacenes
        const warehouses = [];
        for (const whData of storeData.warehouses) {
          const warehouse = await tx.warehouse.upsert({
            where: {
              name_storeId: {
                name: whData.name,
                storeId: store.id,
              },
            },
            update: {},
            create: {
              name: whData.name,
              storeId: store.id,
            },
          });
          warehouses.push(warehouse);
        }

        // Sincronizar áreas de venta
        const salesAreas = [];
        for (const saData of storeData.salesAreas) {
          const salesArea = await tx.salesArea.upsert({
            where: {
              name_storeId: {
                name: saData.name,
                storeId: store.id,
              },
            },
            update: {},
            create: {
              name: saData.name,
              storeId: store.id,
            },
          });
          salesAreas.push(salesArea);
        }

        storeResults.push({
          store,
          warehouses,
          salesAreas,
        });
      }

      return {
        user,
        phones,
        stores: storeResults,
      };
    });
  }

  /**
   * Obtener el perfil completo del usuario
   */
  static async getUserProfile(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: {
        phones: true,
        userStores: {
          where: {
            isActive: true, // Solo mostrar tiendas activas
          },
          include: {
            store: {
              include: {
                warehouses: {
                  where: { isActive: true },
                },
                salesAreas: {
                  where: { isActive: true },
                },
              },
            },
          },
        },
      },
    });
  }

  /**
   * Agregar una tienda a un usuario existente
   */
  static async addStoreToUser(userId: string, storeData: StoreInput) {
    return await prisma.$transaction(async (tx) => {
      // Buscar o crear la tienda
      let store = await tx.store.findUnique({
        where: { name: storeData.name },
      });

      if (!store) {
        store = await tx.store.create({
          data: { name: storeData.name },
        });

        // Crear almacenes
        await Promise.all(
          storeData.warehouses.map((wh) =>
            tx.warehouse.create({
              data: {
                name: wh.name,
                storeId: store!.id,
              },
            })
          )
        );

        // Crear áreas de venta
        await Promise.all(
          storeData.salesAreas.map((sa) =>
            tx.salesArea.create({
              data: {
                name: sa.name,
                storeId: store!.id,
              },
            })
          )
        );
      }

      // Intentar crear la relación - si ya existe, lanzará error
      try {
        const userStore = await tx.userStore.create({
          data: {
            userId,
            storeId: store.id,
          },
        });

        return {
          store,
          userStore,
        };
      } catch (error: any) {
        // Si el error es por unique constraint, dar mensaje claro
        if (error.code === "P2002") {
          throw new Error("Ya estás asociado a esta tienda");
        }
        throw error;
      }
    });
  }

  /**
   * Validar que los nombres de tienda no estén duplicados
   */
  static async validateStoreNames(names: string[]) {
    const existingStores = await prisma.store.findMany({
      where: {
        name: {
          in: names,
        },
      },
      select: {
        name: true,
      },
    });

    return existingStores;
  }

  /**
   * Remover una tienda de un usuario (soft delete)
   */
  static async removeStoreFromUser(userId: string, storeId: string) {
    const userStore = await prisma.userStore.update({
      where: {
        userId_storeId: {
          userId,
          storeId,
        },
      },
      data: {},
    });

    return userStore;
  }

  /**
   * Reactivar una tienda para un usuario
   */
  static async reactivateStoreForUser(userId: string, storeId: string) {
    const userStore = await prisma.userStore.update({
      where: {
        userId_storeId: {
          userId,
          storeId,
        },
      },
      data: {},
    });

    return userStore;
  }

  /**
   * Eliminar permanentemente la relación usuario-tienda
   */
  static async permanentlyRemoveStoreFromUser(userId: string, storeId: string) {
    await prisma.userStore.delete({
      where: {
        userId_storeId: {
          userId,
          storeId,
        },
      },
    });

    return { success: true };
  }

  /**
   * Obtener todas las tiendas (activas e inactivas) de un usuario
   */
  static async getAllUserStores(userId: string, includeInactive = false) {
    return await prisma.userStore.findMany({
      where: {
        userId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: {
        store: {
          include: {
            warehouses: true,
            salesAreas: true,
          },
        },
      },
    });
  }

  /**
   * Obtener estadísticas del usuario
   */
  static async getUserStats(userId: string) {
    const userStores = await prisma.userStore.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        store: {
          include: {
            _count: {
              select: {
                warehouses: true,
                salesAreas: true,
              },
            },
          },
        },
      },
    });

    const totalStores = userStores.length;
    const totalWarehouses = userStores.reduce(
      (acc, us) => acc + us.store._count.warehouses,
      0
    );
    const totalSalesAreas = userStores.reduce(
      (acc, us) => acc + us.store._count.salesAreas,
      0
    );

    const phoneCount = await prisma.phone.count({
      where: { userId },
    });

    return {
      stores: totalStores,
      warehouses: totalWarehouses,
      salesAreas: totalSalesAreas,
      phones: phoneCount,
    };
  }
}
