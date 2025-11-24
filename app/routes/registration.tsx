import { auth } from "~/lib/auth";
import type { Route } from "./+types/registration";
import { redirect, useNavigate } from "react-router";
import { useState } from "react";
import { Plus, Trash, X } from "lucide-react";

type PhoneType = "MOBILE" | "HOME" | "WORK" | "OTHER";
type StoreRole = "OWNER" | "MANAGER" | "EMPLOYEE";

interface Phone {
  number: string;
  type: PhoneType;
  isPrimary: boolean;
}

interface Warehouse {
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  capacity?: number;
  description?: string;
}

interface SalesArea {
  name: string;
  code: string;
  description?: string;
  floor?: string;
  size?: number;
}

interface Store {
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  description?: string;
  role: StoreRole;
  warehouses: Warehouse[];
  salesAreas: SalesArea[];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    throw redirect("/signup");
  }

  return { session };
}

export default function Registration({ loaderData }: Route.ComponentProps) {
  const { session } = loaderData;
  const user = session.user;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState(1);

  // Datos del formulario
  const [formData, setFormData] = useState({
    dateOfBirth: "",
    address: "",
    city: "",
    country: "",
  });

  const [phones, setPhones] = useState<Phone[]>([
    { number: "", type: "MOBILE", isPrimary: true },
  ]);

  const [stores, setStores] = useState<Store[]>([
    {
      name: "",
      code: "",
      address: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      phone: "",
      email: "",
      description: "",
      role: "EMPLOYEE",
      warehouses: [
        {
          name: "",
          code: "",
          address: "",
          city: "",
          state: "",
          capacity: undefined,
          description: "",
        },
      ],
      salesAreas: [
        { name: "", code: "", description: "", floor: "", size: undefined },
      ],
    },
  ]);

  // Funciones para manejar teléfonos
  const addPhone = () => {
    setPhones([...phones, { number: "", type: "MOBILE", isPrimary: false }]);
  };

  const removePhone = (index: number) => {
    if (phones.length > 1) {
      setPhones(phones.filter((_, i) => i !== index));
    }
  };

  const updatePhone = (index: number, field: keyof Phone, value: any) => {
    const newPhones = [...phones];
    newPhones[index] = { ...newPhones[index], [field]: value };

    // Si se marca como primario, desmarcar los demás
    if (field === "isPrimary" && value === true) {
      newPhones.forEach((phone, i) => {
        if (i !== index) phone.isPrimary = false;
      });
    }

    setPhones(newPhones);
  };

  // Funciones para manejar tiendas
  const addStore = () => {
    setStores([
      ...stores,
      {
        name: "",
        code: "",
        address: "",
        city: "",
        state: "",
        country: "",
        postalCode: "",
        phone: "",
        email: "",
        description: "",
        role: "EMPLOYEE",
        warehouses: [
          {
            name: "",
            code: "",
            address: "",
            city: "",
            state: "",
            capacity: undefined,
            description: "",
          },
        ],
        salesAreas: [
          { name: "", code: "", description: "", floor: "", size: undefined },
        ],
      },
    ]);
  };

  const removeStore = (index: number) => {
    if (stores.length > 1) {
      setStores(stores.filter((_, i) => i !== index));
    }
  };

  const updateStore = (index: number, field: keyof Store, value: any) => {
    const newStores = [...stores];
    newStores[index] = { ...newStores[index], [field]: value };
    setStores(newStores);
  };

  // Funciones para manejar almacenes
  const addWarehouse = (storeIndex: number) => {
    const newStores = [...stores];
    newStores[storeIndex].warehouses.push({
      name: "",
      code: "",
      address: "",
      city: "",
      state: "",
      capacity: undefined,
      description: "",
    });
    setStores(newStores);
  };

  const removeWarehouse = (storeIndex: number, warehouseIndex: number) => {
    const newStores = [...stores];
    if (newStores[storeIndex].warehouses.length > 1) {
      newStores[storeIndex].warehouses = newStores[
        storeIndex
      ].warehouses.filter((_, i) => i !== warehouseIndex);
      setStores(newStores);
    }
  };

  const updateWarehouse = (
    storeIndex: number,
    warehouseIndex: number,
    field: keyof Warehouse,
    value: any
  ) => {
    const newStores = [...stores];
    newStores[storeIndex].warehouses[warehouseIndex] = {
      ...newStores[storeIndex].warehouses[warehouseIndex],
      [field]: value,
    };
    setStores(newStores);
  };

  // Funciones para manejar áreas de venta
  const addSalesArea = (storeIndex: number) => {
    const newStores = [...stores];
    newStores[storeIndex].salesAreas.push({
      name: "",
      code: "",
      description: "",
      floor: "",
      size: undefined,
    });
    setStores(newStores);
  };

  const removeSalesArea = (storeIndex: number, areaIndex: number) => {
    const newStores = [...stores];
    if (newStores[storeIndex].salesAreas.length > 1) {
      newStores[storeIndex].salesAreas = newStores[
        storeIndex
      ].salesAreas.filter((_, i) => i !== areaIndex);
      setStores(newStores);
    }
  };

  const updateSalesArea = (
    storeIndex: number,
    areaIndex: number,
    field: keyof SalesArea,
    value: any
  ) => {
    const newStores = [...stores];
    newStores[storeIndex].salesAreas[areaIndex] = {
      ...newStores[storeIndex].salesAreas[areaIndex],
      [field]: value,
    };
    setStores(newStores);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/user/complete-profile-extended", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          phones: phones.filter((p) => p.number.trim() !== ""),
          stores: stores.map((store) => ({
            ...store,
            warehouses: store.warehouses.filter(
              (wh) => wh.name.trim() !== "" && wh.code.trim() !== ""
            ),
            salesAreas: store.salesAreas.filter(
              (sa) => sa.name.trim() !== "" && sa.code.trim() !== ""
            ),
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al completar el perfil");
      }

      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Error al completar el perfil");
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="text-center">
            {user.image && (
              <img
                src={user.image}
                alt={user.name}
                className="w-20 h-20 rounded-full mx-auto mb-3"
              />
            )}
            <h2 className="text-2xl font-bold">¡Bienvenido, {user.name}!</h2>
            <p className="text-gray-600 mt-2">
              Completa tu información para empezar
            </p>
          </div>

          {/* Progress bar */}
          <div className="mt-6">
            <div className="flex justify-between mb-2">
              {["Datos Personales", "Teléfonos", "Tiendas", "Revisión"].map(
                (step, index) => (
                  <span
                    key={index}
                    className={`text-sm font-medium ${
                      index + 1 <= currentStep
                        ? "text-blue-600"
                        : "text-gray-400"
                    }`}
                  >
                    {step}
                  </span>
                )
              )}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg shadow-lg p-6">
            {/* Step 1: Datos Personales */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold mb-4">Datos Personales</h3>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Fecha de Nacimiento
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) =>
                      setFormData({ ...formData, dateOfBirth: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Calle Principal 123"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Ciudad"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      País
                    </label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) =>
                        setFormData({ ...formData, country: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="País"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Teléfonos */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Teléfonos</h3>
                  <button
                    type="button"
                    onClick={addPhone}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    <Plus size={16} />
                    Agregar Teléfono
                  </button>
                </div>

                {phones.map((phone, index) => (
                  <div key={index} className="border rounded p-4 relative">
                    {phones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePhone(index)}
                        className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                      >
                        <X size={20} />
                      </button>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium mb-1">
                          Número <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={phone.number}
                          onChange={(e) =>
                            updatePhone(index, "number", e.target.value)
                          }
                          required
                          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          placeholder="+1234567890"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Tipo
                        </label>
                        <select
                          value={phone.type}
                          onChange={(e) =>
                            updatePhone(
                              index,
                              "type",
                              e.target.value as PhoneType
                            )
                          }
                          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                          <option value="MOBILE">Móvil</option>
                          <option value="HOME">Casa</option>
                          <option value="WORK">Trabajo</option>
                          <option value="OTHER">Otro</option>
                        </select>
                      </div>

                      <div className="flex items-center">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={phone.isPrimary}
                            onChange={(e) =>
                              updatePhone(index, "isPrimary", e.target.checked)
                            }
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm font-medium">
                            Teléfono Principal
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Step 3: Tiendas */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Tiendas</h3>
                  <button
                    type="button"
                    onClick={addStore}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    <Plus size={16} />
                    Agregar Tienda
                  </button>
                </div>

                {stores.map((store, storeIndex) => (
                  <div
                    key={storeIndex}
                    className="border-2 border-gray-200 rounded-lg p-6 relative bg-gray-50"
                  >
                    {stores.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStore(storeIndex)}
                        className="absolute top-4 right-4 text-red-600 hover:text-red-800"
                      >
                        <Trash size={20} />
                      </button>
                    )}

                    <h4 className="font-semibold text-lg mb-4">
                      Tienda {storeIndex + 1}
                    </h4>

                    {/* Información básica de la tienda */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Nombre <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={store.name}
                          onChange={(e) =>
                            updateStore(storeIndex, "name", e.target.value)
                          }
                          required
                          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                          placeholder="Mi Tienda"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Código <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={store.code}
                          onChange={(e) =>
                            updateStore(
                              storeIndex,
                              "code",
                              e.target.value.toUpperCase()
                            )
                          }
                          required
                          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                          placeholder="STORE001"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Tu Rol en la Tienda
                        </label>
                        <select
                          value={store.role}
                          onChange={(e) =>
                            updateStore(
                              storeIndex,
                              "role",
                              e.target.value as StoreRole
                            )
                          }
                          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                        >
                          <option value="EMPLOYEE">Empleado</option>
                          <option value="MANAGER">Gerente</option>
                          <option value="OWNER">Propietario</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={store.email || ""}
                          onChange={(e) =>
                            updateStore(storeIndex, "email", e.target.value)
                          }
                          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                          placeholder="tienda@email.com"
                        />
                      </div>
                    </div>

                    {/* Almacenes */}
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-3">
                        <h5 className="font-medium">Almacenes</h5>
                        <button
                          type="button"
                          onClick={() => addWarehouse(storeIndex)}
                          className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                        >
                          <Plus size={14} />
                          Agregar
                        </button>
                      </div>

                      {store.warehouses.map((warehouse, whIndex) => (
                        <div
                          key={whIndex}
                          className="border rounded p-3 mb-2 bg-white relative"
                        >
                          {store.warehouses.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                removeWarehouse(storeIndex, whIndex)
                              }
                              className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                            >
                              <X size={16} />
                            </button>
                          )}

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium mb-1">
                                Nombre <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={warehouse.name}
                                onChange={(e) =>
                                  updateWarehouse(
                                    storeIndex,
                                    whIndex,
                                    "name",
                                    e.target.value
                                  )
                                }
                                required
                                className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                                placeholder="Almacén Principal"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium mb-1">
                                Código <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={warehouse.code}
                                onChange={(e) =>
                                  updateWarehouse(
                                    storeIndex,
                                    whIndex,
                                    "code",
                                    e.target.value.toUpperCase()
                                  )
                                }
                                required
                                className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                                placeholder="WH001"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Áreas de Venta */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h5 className="font-medium">Áreas de Venta</h5>
                        <button
                          type="button"
                          onClick={() => addSalesArea(storeIndex)}
                          className="flex items-center gap-1 px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-xs"
                        >
                          <Plus size={14} />
                          Agregar
                        </button>
                      </div>

                      {store.salesAreas.map((area, areaIndex) => (
                        <div
                          key={areaIndex}
                          className="border rounded p-3 mb-2 bg-white relative"
                        >
                          {store.salesAreas.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                removeSalesArea(storeIndex, areaIndex)
                              }
                              className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                            >
                              <X size={16} />
                            </button>
                          )}

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium mb-1">
                                Nombre <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={area.name}
                                onChange={(e) =>
                                  updateSalesArea(
                                    storeIndex,
                                    areaIndex,
                                    "name",
                                    e.target.value
                                  )
                                }
                                required
                                className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                                placeholder="Área Principal"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium mb-1">
                                Código <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={area.code}
                                onChange={(e) =>
                                  updateSalesArea(
                                    storeIndex,
                                    areaIndex,
                                    "code",
                                    e.target.value.toUpperCase()
                                  )
                                }
                                required
                                className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                                placeholder="SA001"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Step 4: Revisión */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold mb-4">
                  Revisa tu Información
                </h3>

                <div className="border rounded p-4 bg-gray-50">
                  <h4 className="font-semibold mb-2">Datos Personales</h4>
                  <p className="text-sm text-gray-600">
                    {formData.address && (
                      <>
                        <strong>Dirección:</strong> {formData.address}
                        <br />
                      </>
                    )}
                    {formData.city && (
                      <>
                        <strong>Ciudad:</strong> {formData.city}
                        <br />
                      </>
                    )}
                    {formData.country && (
                      <>
                        <strong>País:</strong> {formData.country}
                      </>
                    )}
                  </p>
                </div>

                <div className="border rounded p-4 bg-gray-50">
                  <h4 className="font-semibold mb-2">
                    Teléfonos ({phones.length})
                  </h4>
                  {phones.map((phone, i) => (
                    <p key={i} className="text-sm text-gray-600">
                      {phone.number} ({phone.type}){" "}
                      {phone.isPrimary && "- Principal"}
                    </p>
                  ))}
                </div>

                <div className="border rounded p-4 bg-gray-50">
                  <h4 className="font-semibold mb-2">
                    Tiendas ({stores.length})
                  </h4>
                  {stores.map((store, i) => (
                    <div key={i} className="mb-3 last:mb-0">
                      <p className="text-sm font-medium">
                        {store.name} ({store.code})
                      </p>
                      <p className="text-xs text-gray-600">
                        - {store.warehouses.length} almacén(es)
                        <br />- {store.salesAreas.length} área(s) de venta
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botones de navegación */}
            <div className="flex justify-between mt-6 pt-6 border-t">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                >
                  Anterior
                </button>
              )}

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="ml-auto px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Siguiente
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="ml-auto px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? "Completando..." : "Completar Registro"}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
