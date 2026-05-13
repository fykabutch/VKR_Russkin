FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 5454
ENV ASPNETCORE_URLS=http://+:5454
ENV ConnectionStrings__DefaultConnection="Data Source=/app/data/TeploenergetikaKursovaya.db"

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["TeploenergetikaKursovaya.sln", "./"]
COPY ["TeploenergetikaKursovaya/TeploenergetikaKursovaya.csproj", "TeploenergetikaKursovaya/"]
RUN dotnet restore "TeploenergetikaKursovaya/TeploenergetikaKursovaya.csproj"
COPY . .
WORKDIR /src/TeploenergetikaKursovaya
RUN dotnet build "TeploenergetikaKursovaya.csproj" -c Release -o /app/build --no-restore

FROM build AS publish
RUN dotnet publish "TeploenergetikaKursovaya.csproj" -c Release -o /app/publish --no-restore /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish ./
COPY ["TeploenergetikaKursovaya/TeploenergetikaKursovaya.db", "/app/seed/TeploenergetikaKursovaya.db"]
ENTRYPOINT ["sh", "-c", "mkdir -p /app/data && if [ ! -f /app/data/TeploenergetikaKursovaya.db ]; then cp /app/seed/TeploenergetikaKursovaya.db /app/data/TeploenergetikaKursovaya.db; fi && exec dotnet TeploenergetikaKursovaya.dll"]
