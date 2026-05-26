import { FolderSimple, Tray } from "@phosphor-icons/react"
import { useBacklog } from "../hooks/context"
import type { Item } from "../api/client"

function BacklogItem({ item }: { item: Item }) {
  return (
    <div className="flex rounded-xl bg-base-200 border border-base-content/8 overflow-hidden">
      <div className="w-1 shrink-0 bg-indigo-500" />
      <div className="flex-1 px-3 py-2.5">
        <p className="text-sm font-medium leading-snug">{item.title}</p>
        {item.transcript && (
          <p className="text-xs text-base-content/40 mt-0.5 line-clamp-2 leading-relaxed">{item.transcript}</p>
        )}
      </div>
    </div>
  )
}

export default function BacklogPage() {
  const { data, isLoading } = useBacklog()

  const isEmpty = !isLoading && data &&
    data.grouped.every((g) => g.items.length === 0) &&
    data.unlinked.length === 0

  return (
    <div className="flex-1 flex flex-col pb-20 px-4">
      <p className="text-[10px] text-base-content/25 pt-5 pb-4 text-center uppercase tracking-widest font-medium">
        Backlog
      </p>

      {isLoading && (
        <div className="flex justify-center py-12">
          <span className="loading loading-ring loading-md text-primary" />
        </div>
      )}

      {isEmpty && (
        <div className="flex flex-col items-center gap-3 text-center py-16">
          <span className="text-base-content/15"><Tray size={48} weight="fill" /></span>
          <p className="text-base-content/35 text-sm">Nenhum item no backlog.</p>
          <p className="text-base-content/20 text-xs">Diga "adicione no backlog do projeto X..." ao gravar!</p>
        </div>
      )}

      {!isLoading && data && !isEmpty && (
        <div className="flex flex-col gap-6">
          {data.grouped.map(({ project, items }) => (
            <section key={project.id}>
              <div className="flex items-center gap-2 mb-2.5">
                <span className={project.active ? "text-primary" : "text-base-content/25"}>
                  <FolderSimple size={16} weight="fill" />
                </span>
                <h3
                  className={[
                    "font-semibold text-sm",
                    !project.active ? "text-base-content/30 line-through" : "",
                  ].join(" ")}
                >
                  {project.name}
                </h3>
                <div className={["w-2 h-2 rounded-full shrink-0", project.active ? "bg-emerald-500" : "bg-base-content/20"].join(" ")} />
                <span className="text-xs text-base-content/30 ml-auto">
                  {items.length} item{items.length !== 1 ? "s" : ""}
                </span>
              </div>
              {items.length === 0 ? (
                <p className="text-xs text-base-content/30 pl-1">Nenhum item.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {items.map((item) => (
                    <BacklogItem key={item.id} item={item} />
                  ))}
                </div>
              )}
            </section>
          ))}

          {data.unlinked.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-base-content/25"><FolderSimple size={16} weight="fill" /></span>
                <h3 className="font-semibold text-sm text-base-content/40">Sem projeto</h3>
                <span className="text-xs text-base-content/30 ml-auto">
                  {data.unlinked.length} item{data.unlinked.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {data.unlinked.map((item) => (
                  <BacklogItem key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
